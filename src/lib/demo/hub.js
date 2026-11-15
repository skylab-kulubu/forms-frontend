const EDIT_DELAY_MS = 320;

class DemoHub {
  constructor(userId) {
    this.userId = userId;
    this.state = "Disconnected";
    this.connectionId = "tanitim";
    this.versions = new Map();
  }

  on() {}
  onreconnecting() {}
  onreconnected() {}
  onclose() {}

  async start() {
    this.state = "Connected";
  }

  async stop() {
    this.state = "Disconnected";
  }

  async send() {}

  async invoke(method, formId, arg) {
    if (method === "Join") {
      this.versions.set(formId, Math.max(this.versions.get(formId) ?? 0, Number(arg) || 0));
      return { status: 200, data: { members: [], canEdit: true, edits: [], snapshotRequired: false } };
    }
    await new Promise((resolve) => setTimeout(resolve, EDIT_DELAY_MS));
    const version = (this.versions.get(formId) ?? 0) + 1;
    this.versions.set(formId, version);
    return { status: 200, data: { version, ops: arg?.ops ?? [], userId: this.userId, dirty: true } };
  }
}

export function createDemoHub(userId) {
  return new DemoHub(userId);
}
