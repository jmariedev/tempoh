import { APIResponseError, Client, collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import {
  CONTRACT,
  PAYMENT,
  PAYMENT_METHOD,
  PROGRESS,
  type Choreographer,
  type ChoreographerInput,
  type ClassInput,
  type ClassItem,
  type Combo,
  type ComboInput,
  type Contract,
  type Dance,
  type DanceInput,
  type Dancer,
  type DancerInput,
  type Payment,
  type PaymentMethod,
  type Progress,
} from "../types";
import { del, issueSignedToken, presignUrl } from "@vercel/blob";
import { fromNotion, toNotion, type RichText } from "../richtext";
import { blobPathname, isBlobUrl } from "../songs";
import { saveComboSources, saveSettings, type Account } from "../session";
import type { Store } from "./types";

type Props = PageObjectResponse["properties"];
type Prop = Props[string];

// Notion caps each rich text item at 2000 characters.
function richText(text: string) {
  const chunks = text.match(/[\s\S]{1,2000}/g) ?? [];
  return chunks.map((content) => ({ type: "text" as const, text: { content } }));
}

function plain(prop: Prop | undefined): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  return "";
}

function formatted(prop: Prop | undefined): RichText {
  return prop?.type === "rich_text" ? fromNotion(prop.rich_text) : [];
}

function relationIds(prop: Prop | undefined): string[] {
  return prop?.type === "relation" ? prop.relation.map((r) => r.id) : [];
}

function selectName<T extends string>(prop: Prop | undefined, allowed: readonly T[]): T | null {
  if (prop?.type !== "select" || !prop.select) return null;
  return (allowed as readonly string[]).includes(prop.select.name) ? (prop.select.name as T) : null;
}

function dateStart(prop: Prop | undefined): string | null {
  return prop?.type === "date" ? (prop.date?.start ?? null) : null;
}

function numberOrNull(prop: Prop | undefined): number | null {
  return prop?.type === "number" ? prop.number : null;
}

/** Private songs can't be opened from their stored link, so this makes a play link that lasts an hour. */
async function playableUrl(url: string) {
  if (!isBlobUrl(url)) return url;
  const pathname = blobPathname(url);
  const validUntil = Date.now() + 60 * 60 * 1000;
  const token = await issueSignedToken({ pathname, operations: ["get"], validUntil });
  return (await presignUrl(token, { operation: "get", pathname, access: "private", validUntil })).presignedUrl;
}

/** Deletes a replaced song from Vercel Blob. Songs uploaded to Notion itself are left alone. */
async function removeBlob(song: { url: string } | null) {
  if (song && isBlobUrl(song.url)) await del(song.url).catch((e) => console.error("Couldn't delete old song", e));
}

function firstFile(prop: Prop | undefined) {
  if (prop?.type !== "files" || prop.files.length === 0) return null;
  const file = prop.files[0];
  const url = file.type === "file" ? file.file.url : file.external.url;
  return { name: file.name, url };
}

function toDance(page: PageObjectResponse): Dance {
  const p = page.properties;
  return {
    id: page.id,
    name: plain(p["Name"]),
    choreographerId: relationIds(p["Choreographer"])[0] ?? null,
    dancerIds: relationIds(p["Dancers"]),
    progress: selectName<Progress>(p["Progress"], PROGRESS) ?? "Scheduled",
    dueDate: dateStart(p["Due Date"]),
    notes: formatted(p["Notes"]),
    songTitle: plain(p["Song Title"]),
    costume: formatted(p["Costume"]),
    contract: selectName<Contract>(p["Contract"], CONTRACT),
    contractDate: dateStart(p["Contract Date"]),
    payment: selectName<Payment>(p["Payment"], PAYMENT),
    amountPaid: numberOrNull(p["Amount Paid"]),
    paymentMethod: selectName<PaymentMethod>(p["Payment Method"], PAYMENT_METHOD),
    songName: firstFile(p["Song"])?.name ?? null,
  };
}

function toDancer(page: PageObjectResponse): Dancer {
  return {
    id: page.id,
    name: plain(page.properties["Name"]),
    birthdate: dateStart(page.properties["Birthdate"]),
    age: numberOrNull(page.properties["Set Age"]),
  };
}

function toChoreographer(page: PageObjectResponse): Choreographer {
  return { id: page.id, name: plain(page.properties["Name"]) };
}

function toCombo(page: PageObjectResponse): Combo {
  const p = page.properties;
  return {
    id: page.id,
    name: plain(p["Name"]),
    date: dateStart(p["Date"]),
    classId: relationIds(p["Class"])[0] ?? null,
    songTitle: plain(p["Song Title"]),
    notes: plain(p["Notes"]),
    songName: firstFile(p["Song"])?.name ?? null,
  };
}

function toClass(page: PageObjectResponse): ClassItem {
  return { id: page.id, name: plain(page.properties["Name"]) };
}

function comboProps(input: ComboInput) {
  return {
    Name: { title: richText(input.name) },
    Date: { date: input.date ? { start: input.date } : null },
    Class: { relation: input.classId ? [{ id: input.classId }] : [] },
    "Song Title": { rich_text: richText(input.songTitle) },
    Notes: { rich_text: richText(input.notes) },
  };
}

function classProps(input: ClassInput) {
  return { Name: { title: richText(input.name) } };
}

const title = (text: string) => [{ type: "text" as const, text: { content: text } }];

function danceProps(input: DanceInput) {
  return {
    Name: { title: richText(input.name) },
    Choreographer: { relation: input.choreographerId ? [{ id: input.choreographerId }] : [] },
    Dancers: { relation: input.dancerIds.map((id) => ({ id })) },
    Progress: { select: { name: input.progress } },
    "Due Date": { date: input.dueDate ? { start: input.dueDate } : null },
    Notes: { rich_text: toNotion(input.notes) },
    "Song Title": { rich_text: richText(input.songTitle) },
    Costume: { rich_text: toNotion(input.costume) },
    Contract: { select: input.contract ? { name: input.contract } : null },
    "Contract Date": { date: input.contractDate ? { start: input.contractDate } : null },
    Payment: { select: input.payment ? { name: input.payment } : null },
    "Amount Paid": { number: input.amountPaid },
    "Payment Method": { select: input.paymentMethod ? { name: input.paymentMethod } : null },
  };
}

function dancerProps(input: DancerInput) {
  return {
    Name: { title: richText(input.name) },
    Birthdate: { date: input.birthdate ? { start: input.birthdate } : null },
    "Set Age": { number: input.birthdate ? null : input.age },
  };
}

function choreographerProps(input: ChoreographerInput) {
  return { Name: { title: richText(input.name) } };
}

/** A store that reads and writes one person's Notion, using their own access token. */
export function createNotionStore(account: Account): Store {
  const notion = new Client({ auth: account.accessToken });
  const DS = { ...account.dataSources };

  /** The page the Dances database sits on, where Combos and Classes go too. */
  async function homePage() {
    const source = await notion.dataSources.retrieve({ data_source_id: DS.dances });
    const parent = "database_parent" in source ? source.database_parent : null;
    if (!parent || parent.type !== "page_id") throw new Error("Couldn't find your tempoh page in Notion");
    return parent.page_id;
  }

  async function findOnPage(pageId: string, name: string) {
    let cursor: string | undefined;
    do {
      const page = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
      for (const block of page.results) {
        if (!("type" in block) || block.type !== "child_database" || block.child_database.title.trim() !== name) continue;
        const db = await notion.databases.retrieve({ database_id: block.id });
        const source = "data_sources" in db ? db.data_sources[0] : undefined;
        if (source) return source.id;
      }
      cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return null;
  }

  async function makeDatabase(pageId: string, name: string, properties: Record<string, unknown>) {
    const db = await notion.databases.create({
      parent: { type: "page_id", page_id: pageId },
      title: title(name),
      initial_data_source: { properties: properties as never },
    });
    const source = "data_sources" in db ? db.data_sources[0] : undefined;
    if (!source) throw new Error(`Notion didn't return the new ${name} database`);
    return source.id;
  }

  let combosReady: Promise<{ combos: string; classes: string }> | null = null;
  /**
   * Older tempoh pages have no Combos or Classes yet. The first time combos are used,
   * this finds them on the tempoh page or adds them there, then remembers where they are.
   */
  function comboSources() {
    if (DS.combos && DS.classes) return Promise.resolve({ combos: DS.combos, classes: DS.classes });
    combosReady ??= (async () => {
      const page = await homePage();
      const classes =
        (await findOnPage(page, "Classes")) ?? (await makeDatabase(page, "Classes", { Name: { title: {} } }));
      const combos =
        (await findOnPage(page, "Combos")) ??
        (await makeDatabase(page, "Combos", {
          Name: { title: {} },
          Date: { date: {} },
          Class: { relation: { data_source_id: classes, type: "single_property", single_property: {} } },
          "Song Title": { rich_text: {} },
          Notes: { rich_text: {} },
          Song: { files: {} },
        }));
      DS.combos = combos;
      DS.classes = classes;
      await saveComboSources(account.botId, combos, classes);
      return { combos, classes };
    })().catch((err) => {
      combosReady = null;
      throw err;
    });
    return combosReady;
  }

  async function queryAll(dataSourceId: string) {
    const results = await collectPaginatedAPI(notion.dataSources.query, { data_source_id: dataSourceId });
    return results.filter(isFullPage);
  }

  async function create(dataSourceId: string, properties: Record<string, unknown>) {
    const page = await notion.pages.create({
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
    });
    if (!isFullPage(page)) throw new Error("Notion returned a partial page");
    return page;
  }

  /** Older tempoh copies have no "Set Age" property, so it's added the first time it's needed. */
  async function withSetAge<T>(write: () => Promise<T>) {
    try {
      return await write();
    } catch (err) {
      if (!(err instanceof APIResponseError) || !err.message.includes("Set Age")) throw err;
      await notion.dataSources.update({ data_source_id: DS.dancers, properties: { "Set Age": { number: {} } } });
      return write();
    }
  }

  async function storedSong(danceId: string) {
    const page = await notion.pages.retrieve({ page_id: danceId });
    return isFullPage(page) ? firstFile(page.properties["Song"]) : null;
  }

  async function update(pageId: string, properties: Record<string, unknown>) {
    const page = await notion.pages.update({
      page_id: pageId,
      properties: properties as Parameters<typeof notion.pages.update>[0]["properties"],
    });
    if (!isFullPage(page)) throw new Error("Notion returned a partial page");
    return page;
  }

  async function trash(pageId: string) {
    await notion.pages.update({ page_id: pageId, in_trash: true });
  }

  return {
    mode: "notion",

    async load() {
      const { settings } = account;
      const none = Promise.resolve([] as PageObjectResponse[]);
      const sources = settings.combos ? await comboSources() : null;
      const [dances, dancers, choreographers, combos, classes] = await Promise.all([
        settings.dances ? queryAll(DS.dances) : none,
        settings.dances ? queryAll(DS.dancers) : none,
        settings.dances ? queryAll(DS.choreographers) : none,
        sources ? queryAll(sources.combos) : none,
        sources ? queryAll(sources.classes) : none,
      ]);
      return {
        settings,
        dances: dances.map(toDance),
        dancers: dancers.map(toDancer),
        choreographers: choreographers.map(toChoreographer),
        combos: combos.map(toCombo),
        classes: classes.map(toClass),
      };
    },

    async saveSettings(settings) {
      await saveSettings(account.botId, settings);
      account.settings = settings;
      return settings;
    },

    createCombo: async (input) => toCombo(await create((await comboSources()).combos, comboProps(input))),
    updateCombo: async (id, input) => toCombo(await update(id, comboProps(input))),
    deleteCombo: trash,

    createClass: async (input) => toClass(await create((await comboSources()).classes, classProps(input))),
    updateClass: async (id, input) => toClass(await update(id, classProps(input))),
    deleteClass: trash,

    createDance: async (input) => toDance(await create(DS.dances, danceProps(input))),
    updateDance: async (id, input) => toDance(await update(id, danceProps(input))),
    deleteDance: trash,

    createDancer: async (input) => toDancer(await withSetAge(() => create(DS.dancers, dancerProps(input)))),
    updateDancer: async (id, input) => toDancer(await withSetAge(() => update(id, dancerProps(input)))),
    deleteDancer: trash,

    createChoreographer: async (input) =>
      toChoreographer(await create(DS.choreographers, choreographerProps(input))),
    updateChoreographer: async (id, input) =>
      toChoreographer(await update(id, choreographerProps(input))),
    deleteChoreographer: trash,

    // Notion's file URLs expire after an hour, so this re-reads the page each time.
    async songSource(danceId) {
      const song = await storedSong(danceId);
      return song && { ...song, url: await playableUrl(song.url) };
    },

    async uploadSong() {
      throw new Error("Songs upload straight to storage");
    },

    async linkSong(danceId, song) {
      const old = await storedSong(danceId);
      await update(danceId, {
        Song: { files: [{ type: "external", name: song.name.slice(0, 100), external: { url: song.url } }] },
      });
      await removeBlob(old);
    },

    async removeSong(danceId) {
      const old = await storedSong(danceId);
      await update(danceId, { Song: { files: [] } });
      await removeBlob(old);
    },
  };
}
