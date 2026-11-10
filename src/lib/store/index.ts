import { currentAccount, currentDemoId } from "../session";
import { createDemoStore } from "./demo";
import { createNotionStore } from "./notion";
import type { Store } from "./types";

export class SignedOutError extends Error {
  constructor() {
    super("Sign in to continue");
  }
}

/** The data store for whoever is making this request: their Notion, or their demo copy. */
export async function getStore(): Promise<Store & { who: { name: string | null; workspace: string | null } }> {
  const account = await currentAccount();
  if (account) {
    return {
      ...createNotionStore(account),
      who: { name: account.name, workspace: account.workspaceName },
    };
  }
  const demoId = await currentDemoId();
  if (demoId) return { ...createDemoStore(demoId), who: { name: null, workspace: null } };
  throw new SignedOutError();
}
