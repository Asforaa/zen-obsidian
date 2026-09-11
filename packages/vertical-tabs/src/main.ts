import {
  ItemView,
  Menu,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
  WorkspaceSplit,
  setIcon,
} from "obsidian";

const VIEW_TYPE = "brave-tabs-view";

type WorkspaceNode = {
  children?: WorkspaceNode[];
};

type MainTabGroup = SidebarTabGroup & WorkspaceNode;

type SidebarSplit = {
  children: SidebarTabGroup[];
  recomputeChildrenDimensions: () => void;
};

type SidebarTabGroup = {
  id: string;
  children: WorkspaceLeaf[];
  containerEl: HTMLElement;
  currentTab: number;
  parent: SidebarSplit;
  insertChild: (index: number, leaf: WorkspaceLeaf) => void;
  removeChild: (leaf: WorkspaceLeaf) => void;
  selectTab: (leaf: WorkspaceLeaf) => void;
  recomputeChildrenDimensions: () => void;
  setDimension: (dimension: number | null) => void;
};

type InternalLeaf = WorkspaceLeaf & {
  id: string;
  activeTime: number;
  containerEl: HTMLElement;
  tabHeaderEl: HTMLElement;
  parent: SidebarTabGroup;
};

type VerticalTabsData = {
  orderedLeafIds: string[];
  splitLeafIds: string[];
  ensureLocalGraph: boolean;
  compactRibbon: boolean;
  demoStartNote?: string;
};

const LOCAL_GRAPH_OPTIONS = {
  "collapse-filter": true,
  search: "",
  localJumps: 1,
  localBacklinks: true,
  localForelinks: true,
  localInterlinks: false,
  showTags: false,
  showAttachments: false,
  hideUnresolved: false,
  "collapse-color-groups": true,
  colorGroups: [],
  "collapse-display": true,
  showArrow: false,
  textFadeMultiplier: 0,
  nodeSizeMultiplier: 1,
  lineSizeMultiplier: 1,
  "collapse-forces": true,
  centerStrength: 0.518713248970312,
  repelStrength: 10,
  linkStrength: 1,
  linkDistance: 250,
  close: true,
};

const LOCAL_GRAPH_HEIGHT_PERCENT = 34.763948497854074;

type UndoHistoryEntry = {
  rootId?: string;
  state?: { type?: string };
};

type DomSnapshot = {
  element: HTMLElement;
  className: string;
  style: string | null;
  ariaSelected: string | null;
  tabIndex: string | null;
};

export default class BraveTabsPlugin extends Plugin {
  private renderQueued = false;
  private activeMainLeaf: WorkspaceLeaf | null = null;
  private ensureTimer: number | null = null;
  private localGraphEnsureTimer: number | null = null;
  private orderedLeafIds: string[] = [];
  private splitLeafIds: string[] = [];
  ensureLocalGraph = false;
  compactRibbon = false;
  private demoStartNote: string | undefined;
  private groupSignature = "";
  private renderHoldCount = 0;
  private renderPending = false;
  private rightSidebarToggle: HTMLElement | null = null;
  private rightSidebarToggleMarker: Comment | null = null;
  private rightSidebarObserver: MutationObserver | null = null;
  private rightSidebarRelocationQueued = false;

  async onload(): Promise<void> {
    const stored = (await this.loadData()) as Partial<VerticalTabsData> | null;
    this.orderedLeafIds = stored?.orderedLeafIds ?? [];
    this.splitLeafIds = stored?.splitLeafIds ?? [];
    this.ensureLocalGraph = stored?.ensureLocalGraph ?? false;
    this.compactRibbon = stored?.compactRibbon ?? false;
    this.demoStartNote = stored?.demoStartNote;
    this.removeLegacyUi();
    document.body.classList.add("vertical-tabs-unified-header");
    document.body.classList.toggle("vertical-tabs-compact-ribbon", this.compactRibbon);
    this.registerView(VIEW_TYPE, (leaf) => new BraveTabsView(leaf, this));
    this.addSettingTab(new VerticalTabsSettingTab(this));

    this.addCommand({
      id: "show-vertical-tabs",
      name: "Show vertical tabs",
      callback: () => void this.activateView(),
    });

    this.addCommand({
      id: "toggle-tabs-file-explorer",
      name: "Toggle tabs and file explorer",
      callback: () => void this.toggleTabsAndFileExplorer(),
    });

    this.addCommand({
      id: "close-active-main-tab",
      name: "Close active main tab",
      callback: () => {
        this.getActiveTabLeaf()?.detach();
      },
    });

    this.addCommand({
      id: "undo-close-main-tab",
      name: "Undo close main tab",
      callback: () => {
        const workspace = this.app.workspace as unknown as {
          rootSplit: { id: string };
          undoHistory: UndoHistoryEntry[];
        };
        const historyIndex = workspace.undoHistory.findIndex((entry) =>
          entry.state?.type !== VIEW_TYPE
          && (!entry.rootId || entry.rootId === workspace.rootSplit.id),
        );
        if (historyIndex < 0) return;
        const [entry] = workspace.undoHistory.splice(historyIndex, 1);
        workspace.undoHistory.unshift(entry);
        const commands = (this.app as unknown as {
          commands: { executeCommandById: (id: string) => unknown };
        }).commands;
        void commands.executeCommandById("workspace:undo-close-pane");
      },
    });

    this.addCommand({
      id: "toggle-left-sidebar",
      name: "Toggle left sidebar",
      callback: () => {
        const workspace = this.app.workspace as unknown as {
          leftSplit: { toggle: () => void };
        };
        workspace.leftSplit.toggle();
      },
    });

    this.addCommand({
      id: "toggle-right-sidebar",
      name: "Toggle right sidebar",
      callback: () => {
        const workspace = this.app.workspace as unknown as {
          rightSplit: { toggle: () => void };
        };
        workspace.rightSplit.toggle();
      },
    });

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.reconcileSessions();
        this.queueRender();
        this.scheduleEnsureSidebarView();
        this.scheduleEnsureLocalGraph();
        this.scheduleRightSidebarToggleRelocation();
      }),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.getRoot() === this.app.workspace.rootSplit) {
          this.activeMainLeaf = leaf;
        }
        this.queueRender();
        this.scheduleRightSidebarToggleRelocation();
        this.animateActiveHeaderTitle();
      }),
    );
    this.registerEvent(this.app.workspace.on("file-open", () => {
      this.queueRender();
      this.animateActiveHeaderTitle();
    }));

    this.app.workspace.onLayoutReady(() => {
      void this.openDemoStartNote().finally(() => {
        this.reconcileSessions();
        this.scheduleEnsureSidebarView();
        this.scheduleEnsureLocalGraph();
        this.observeRightSidebarToggle();
        this.scheduleRightSidebarToggleRelocation();
      });
    });
  }

  onunload(): void {
    if (this.ensureTimer !== null) window.clearTimeout(this.ensureTimer);
    if (this.localGraphEnsureTimer !== null) window.clearTimeout(this.localGraphEnsureTimer);
    this.rightSidebarObserver?.disconnect();
    this.rightSidebarObserver = null;
    this.showAllMainGroups();
    this.restoreRightSidebarToggle();
    document.body.classList.remove("vertical-tabs-unified-header");
    document.body.classList.remove("vertical-tabs-compact-ribbon");
    this.removeLegacyUi();
  }

  getTabLeaves(): WorkspaceLeaf[] {
    const root = (this.app.workspace as unknown as { rootSplit: WorkspaceNode }).rootSplit;
    const leaves: WorkspaceLeaf[] = [];
    const visit = (node: WorkspaceNode | WorkspaceLeaf): void => {
      if (node instanceof WorkspaceLeaf) {
        leaves.push(node);
        return;
      }
      node.children?.forEach(visit);
    };
    visit(root);
    return leaves;
  }

  getTabGroups(): MainTabGroup[] {
    const root = (this.app.workspace as unknown as { rootSplit: WorkspaceNode }).rootSplit;
    const groups: MainTabGroup[] = [];
    const visit = (node: WorkspaceNode | WorkspaceLeaf): void => {
      if (node instanceof WorkspaceLeaf) return;
      const children = node.children ?? [];
      if (children.length > 0 && children.every((child) => child instanceof WorkspaceLeaf)) {
        groups.push(node as MainTabGroup);
        return;
      }
      children.forEach(visit);
    };
    visit(root);
    return groups;
  }

  getOrderedLeaves(): WorkspaceLeaf[] {
    const leaves = this.getTabLeaves();
    const byId = new Map(leaves.map((leaf) => [(leaf as InternalLeaf).id, leaf]));
    return this.orderedLeafIds.map((id) => byId.get(id)).filter((leaf): leaf is WorkspaceLeaf => Boolean(leaf));
  }

  getSplitLeaves(): WorkspaceLeaf[] {
    const byId = new Map(this.getTabLeaves().map((leaf) => [(leaf as InternalLeaf).id, leaf]));
    const splitIds = new Set(this.splitLeafIds);
    return this.orderedLeafIds
      .filter((id) => splitIds.has(id))
      .map((id) => byId.get(id))
      .filter((leaf): leaf is WorkspaceLeaf => Boolean(leaf));
  }

  reorderLeaf(source: WorkspaceLeaf, target: WorkspaceLeaf, placeAfter: boolean): void {
    const sourceId = (source as InternalLeaf).id;
    const targetId = (target as InternalLeaf).id;
    const splitIds = new Set(this.splitLeafIds);
    const sourceIds = splitIds.has(sourceId) ? this.orderedLeafIds.filter((id) => splitIds.has(id)) : [sourceId];
    const targetIds = splitIds.has(targetId) ? this.orderedLeafIds.filter((id) => splitIds.has(id)) : [targetId];
    if (sourceIds.some((id) => targetIds.includes(id))) return;

    const remaining = this.orderedLeafIds.filter((id) => !sourceIds.includes(id));
    const targetIndexes = targetIds.map((id) => remaining.indexOf(id)).filter((index) => index >= 0);
    const insertion = placeAfter ? Math.max(...targetIndexes) + 1 : Math.min(...targetIndexes);
    remaining.splice(insertion, 0, ...sourceIds);
    this.orderedLeafIds = remaining;
    void this.persistData();
    this.queueRender();
  }

  getActiveTabLeaf(): WorkspaceLeaf | null {
    const active = this.app.workspace.activeLeaf;
    if (active?.getRoot() === this.app.workspace.rootSplit) {
      this.activeMainLeaf = active;
    }
    const leaves = this.getTabLeaves();
    if (this.activeMainLeaf && leaves.includes(this.activeMainLeaf)) {
      return this.activeMainLeaf;
    }
    this.activeMainLeaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
    return this.activeMainLeaf;
  }

  rememberActiveTab(leaf: WorkspaceLeaf): void {
    this.activeMainLeaf = leaf;
  }

  activateTabSession(leaf: WorkspaceLeaf): void {
    const leafId = (leaf as InternalLeaf).id;
    const splitLeaves = this.getSplitLeaves();
    if (this.splitLeafIds.includes(leafId) && splitLeaves.length > 1) {
      this.showAllMainGroups();
      for (const splitLeaf of splitLeaves) {
        const group = splitLeaf.parent as unknown as MainTabGroup;
        if (group.children.includes(splitLeaf)) group.selectTab(splitLeaf);
      }
    } else {
      const selectedGroup = leaf.parent as unknown as MainTabGroup;
      for (const group of this.getTabGroups()) {
        group.containerEl.classList.toggle("brave-tabs-pane-hidden", group !== selectedGroup);
        group.containerEl.classList.toggle("brave-tabs-pane-single", group === selectedGroup);
      }
      if (selectedGroup.children.includes(leaf)) selectedGroup.selectTab(leaf);
    }
    this.rememberActiveTab(leaf);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    this.queueRender();
  }

  openFullContextMenu(leaf: WorkspaceLeaf, event: MouseEvent): void {
    const target = leaf as InternalLeaf;
    const group = target.parent;
    const targetIndex = group.children.indexOf(target);
    if (targetIndex < 0) return;

    const previousIndex = group.currentTab;
    const workspace = this.app.workspace as unknown as { activeLeaf: WorkspaceLeaf | null };
    const previousWorkspaceLeaf = workspace.activeLeaf;
    const tracked = group.children.map((candidate) => candidate as InternalLeaf);
    const snapshots = tracked.flatMap((candidate) => [
      this.snapshotElement(candidate.tabHeaderEl),
      this.snapshotElement(candidate.containerEl),
    ]);
    type MenuWithParent = Menu & { parentEl?: HTMLElement | null };
    type ShowAtPosition = (this: MenuWithParent, ...args: unknown[]) => unknown;
    const menuPrototype = Menu.prototype as unknown as { showAtPosition: ShowAtPosition };
    const nativeShowAtPosition = menuPrototype.showAtPosition;
    let menuIntercepted = false;
    const showUnanchoredMenu: ShowAtPosition = function (...args: unknown[]): unknown {
      menuIntercepted = true;
      menuPrototype.showAtPosition = nativeShowAtPosition;
      this.parentEl = null;
      return nativeShowAtPosition.apply(this, args);
    };

    try {
      // Obsidian anchors a tab menu to the native horizontal tab header and
      // hides it after 500 ms when that hidden header is not hovered. The
      // pointer is actually over our vertical row, so make this one menu
      // unanchored while preserving Obsidian's own menu construction/actions.
      menuPrototype.showAtPosition = showUnanchoredMenu;
      group.currentTab = targetIndex;
      workspace.activeLeaf = target;
      for (const candidate of tracked) {
        const isTarget = candidate === target;
        candidate.tabHeaderEl.classList.toggle("is-active", isTarget);
        candidate.containerEl.classList.toggle("mod-active", isTarget);
        candidate.containerEl.style.setProperty("display", isTarget ? "flex" : "none", "important");
      }
      target.tabHeaderEl.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          clientX: event.clientX,
          clientY: event.clientY,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
        }),
      );
    } finally {
      if (!menuIntercepted) {
        window.setTimeout(() => {
          if (menuPrototype.showAtPosition === showUnanchoredMenu) {
            menuPrototype.showAtPosition = nativeShowAtPosition;
          }
        }, 250);
      }
      group.currentTab = previousIndex;
      workspace.activeLeaf = previousWorkspaceLeaf;
      for (const snapshot of snapshots) this.restoreElement(snapshot);
      window.queueMicrotask(() => {
        workspace.activeLeaf = previousWorkspaceLeaf;
      });
    }
  }

  holdRendering(): () => void {
    this.renderHoldCount += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.renderHoldCount = Math.max(0, this.renderHoldCount - 1);
      if (this.renderHoldCount === 0 && this.renderPending) {
        this.renderPending = false;
        this.queueRender();
      }
    };
  }

  queueRender(): void {
    if (this.renderHoldCount > 0) {
      this.renderPending = true;
      return;
    }
    if (this.renderQueued) return;
    this.renderQueued = true;
    window.requestAnimationFrame(() => {
      this.renderQueued = false;
      this.app.workspace
        .getLeavesOfType(VIEW_TYPE)
        .forEach((leaf) => {
          const view = leaf.view as Partial<BraveTabsView>;
          if (typeof view.renderTabs === "function") view.renderTabs();
        });
    });
  }

  private removeLegacyUi(): void {
    document.body.classList.remove("brave-tabs-pinned");
    document.querySelectorAll(".brave-tabs-shell").forEach((element) => element.remove());
  }

  private scheduleRightSidebarToggleRelocation(): void {
    if (this.rightSidebarRelocationQueued) return;
    this.rightSidebarRelocationQueued = true;
    window.queueMicrotask(() => {
      this.rightSidebarRelocationQueued = false;
      if (!document.body.classList.contains("vertical-tabs-unified-header")) return;
      this.relocateRightSidebarToggle();
    });
  }

  private observeRightSidebarToggle(): void {
    if (this.rightSidebarObserver) return;
    const workspace = document.querySelector(".workspace");
    if (!workspace) return;
    this.rightSidebarObserver = new MutationObserver(() => {
      const toggle = this.rightSidebarToggle;
      if (!toggle?.isConnected || !toggle.parentElement?.classList.contains("mod-root")) {
        this.scheduleRightSidebarToggleRelocation();
      }
    });
    this.rightSidebarObserver.observe(workspace, { childList: true, subtree: true });
  }

  private relocateRightSidebarToggle(): void {
    let toggle = this.rightSidebarToggle;
    if (!toggle?.isConnected) {
      toggle = document.querySelector<HTMLElement>(
        ".workspace .sidebar-toggle-button.mod-right",
      );
      if (!toggle) return;
      this.rightSidebarToggle = toggle;
      this.rightSidebarToggleMarker = document.createComment("vertical-tabs-right-sidebar-toggle");
      toggle.before(this.rightSidebarToggleMarker);
    }

    const root = document.querySelector<HTMLElement>(".workspace-split.mod-root");
    if (!root) return;
    const marker = this.rightSidebarToggleMarker;
    if (marker && !toggle.parentElement?.classList.contains("mod-root")) {
      toggle.before(marker);
    }
    document.querySelectorAll<HTMLElement>(".sidebar-toggle-button.mod-right").forEach((candidate) => {
      candidate.classList.toggle(
        "brave-tabs-stale-right-toggle",
        candidate !== toggle,
      );
    });
    toggle.classList.remove("brave-tabs-stale-right-toggle");
    toggle.classList.add("brave-tabs-relocated-right-toggle");
    if (toggle.parentElement !== root) root.append(toggle);
  }

  private animateActiveHeaderTitle(): void {
    window.requestAnimationFrame(() => {
      const activeLeaf = this.getActiveTabLeaf() as InternalLeaf | null;
      const title = activeLeaf?.containerEl.querySelector<HTMLElement>(".view-header-title-container");
      if (!title) return;
      title.classList.remove("brave-tabs-title-changing");
      void title.offsetWidth;
      title.classList.add("brave-tabs-title-changing");
      window.setTimeout(() => title.classList.remove("brave-tabs-title-changing"), 460);
    });
  }

  private restoreRightSidebarToggle(): void {
    const toggle = this.rightSidebarToggle;
    const marker = this.rightSidebarToggleMarker;
    if (toggle && marker?.parentNode) marker.replaceWith(toggle);
    else marker?.remove();
    toggle?.classList.remove("brave-tabs-relocated-right-toggle");
    document.querySelectorAll<HTMLElement>(".brave-tabs-stale-right-toggle").forEach((candidate) => {
      candidate.classList.remove("brave-tabs-stale-right-toggle");
    });
    this.rightSidebarToggle = null;
    this.rightSidebarToggleMarker = null;
  }

  private snapshotElement(element: HTMLElement): DomSnapshot {
    return {
      element,
      className: element.className,
      style: element.getAttribute("style"),
      ariaSelected: element.getAttribute("aria-selected"),
      tabIndex: element.getAttribute("tabindex"),
    };
  }

  private restoreElement(snapshot: DomSnapshot): void {
    snapshot.element.className = snapshot.className;
    if (snapshot.style === null) snapshot.element.removeAttribute("style");
    else snapshot.element.setAttribute("style", snapshot.style);
    if (snapshot.ariaSelected === null) snapshot.element.removeAttribute("aria-selected");
    else snapshot.element.setAttribute("aria-selected", snapshot.ariaSelected);
    if (snapshot.tabIndex === null) snapshot.element.removeAttribute("tabindex");
    else snapshot.element.setAttribute("tabindex", snapshot.tabIndex);
  }

  private reconcileSessions(): void {
    const leaves = this.getTabLeaves();
    const ids = leaves.map((leaf) => (leaf as InternalLeaf).id);
    const validIds = new Set(ids);
    const nextOrder = this.orderedLeafIds.filter((id) => validIds.has(id));
    for (const id of ids) if (!nextOrder.includes(id)) nextOrder.push(id);
    this.orderedLeafIds = nextOrder;

    const groups = this.getTabGroups();
    const signature = groups.map((group) => group.id).join("|");
    const savedSplitStillValid = this.splitLeafIds.length > 1
      && this.splitLeafIds.every((id) => validIds.has(id));
    if (groups.length < 2) {
      this.splitLeafIds = [];
      this.showAllMainGroups();
    } else if (!savedSplitStillValid || (this.groupSignature !== "" && signature !== this.groupSignature)) {
      this.splitLeafIds = groups
        .map((group) => group.children[group.currentTab])
        .filter((leaf): leaf is WorkspaceLeaf => Boolean(leaf))
        .map((leaf) => (leaf as InternalLeaf).id);
    }
    this.groupSignature = signature;
    void this.persistData();
  }

  private showAllMainGroups(): void {
    for (const group of this.getTabGroups()) {
      group.containerEl.classList.remove("brave-tabs-pane-hidden", "brave-tabs-pane-single");
    }
  }

  private async persistData(): Promise<void> {
    await this.saveData({
      orderedLeafIds: this.orderedLeafIds,
      splitLeafIds: this.splitLeafIds,
      ensureLocalGraph: this.ensureLocalGraph,
      compactRibbon: this.compactRibbon,
      ...(this.demoStartNote ? { demoStartNote: this.demoStartNote } : {}),
    } satisfies VerticalTabsData);
  }

  private async openDemoStartNote(): Promise<void> {
    const path = this.demoStartNote;
    if (!path) return;
    this.demoStartNote = undefined;
    await this.persistData();
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    const target = this.getActiveTabLeaf() ?? this.getTabLeaves()[0] ?? this.app.workspace.getLeaf(true);
    await target.openFile(file, { active: true });
  }

  async setEnsureLocalGraph(enabled: boolean): Promise<void> {
    this.ensureLocalGraph = enabled;
    await this.persistData();
    if (enabled) {
      this.scheduleEnsureLocalGraph();
      return;
    }
    for (const leaf of this.app.workspace.getLeavesOfType("localgraph")) leaf.detach();
    this.app.workspace.requestSaveLayout();
  }

  async setCompactRibbon(enabled: boolean): Promise<void> {
    this.compactRibbon = enabled;
    document.body.classList.toggle("vertical-tabs-compact-ribbon", enabled);
    await this.persistData();
  }

  private scheduleEnsureLocalGraph(): void {
    if (!this.ensureLocalGraph) return;
    if (this.localGraphEnsureTimer !== null) window.clearTimeout(this.localGraphEnsureTimer);
    this.localGraphEnsureTimer = window.setTimeout(() => {
      this.localGraphEnsureTimer = null;
      void this.ensureLocalGraphView();
    }, 350);
  }

  private async ensureLocalGraphView(): Promise<void> {
    if (!this.ensureLocalGraph || this.app.workspace.getLeavesOfType("localgraph").length > 0) return;
    const workspace = this.app.workspace as unknown as {
      ensureSideLeaf: (
        type: string,
        side: "left" | "right",
        options: { active: boolean; reveal: boolean; split: boolean; state: Record<string, unknown> },
      ) => Promise<WorkspaceLeaf>;
      getActiveFile: () => { path: string } | null;
    };
    const file = workspace.getActiveFile();
    try {
      const leaf = await workspace.ensureSideLeaf("localgraph", "left", {
        active: false,
        reveal: false,
        split: true,
        state: {
          ...(file ? { file: file.path } : {}),
          options: LOCAL_GRAPH_OPTIONS,
        },
      });
      const group = leaf.parent as unknown as SidebarTabGroup;
      const split = group.parent;
      if (split.children.length === 2) {
        group.setDimension(LOCAL_GRAPH_HEIGHT_PERCENT);
        const sibling = split.children.find((candidate) => candidate !== group);
        sibling?.setDimension(100 - LOCAL_GRAPH_HEIGHT_PERCENT);
        split.recomputeChildrenDimensions();
      }
      this.app.workspace.requestSaveLayout();
    } catch (error) {
      console.warn("Vertical Tabs could not provision Local Graph", error);
    }
  }

  private getExplorerGroup(): SidebarTabGroup | null {
    const explorer = this.app.workspace.getLeavesOfType("file-explorer")[0];
    return explorer ? (explorer.parent as unknown as SidebarTabGroup) : null;
  }

  private scheduleEnsureSidebarView(): void {
    if (this.ensureTimer !== null) window.clearTimeout(this.ensureTimer);
    this.ensureTimer = window.setTimeout(() => {
      this.ensureTimer = null;
      void this.ensureSidebarView();
    }, 250);
  }

  private async ensureSidebarView(): Promise<WorkspaceLeaf | null> {
    const group = this.getExplorerGroup();
    if (!group) {
      window.setTimeout(() => void this.ensureSidebarView(), 250);
      return null;
    }

    const selectedLeaf = group.children[group.currentTab];
    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    let leaf = views.find((candidate) => candidate.parent === (group as unknown)) ?? views[0];
    let changed = false;

    for (const duplicate of views) {
      if (duplicate !== leaf) {
        duplicate.detach();
        changed = true;
      }
    }

    if (!leaf) {
      leaf = this.app.workspace.createLeafInParent(
        group as unknown as WorkspaceSplit,
        0,
      );
      await leaf.setViewState({ type: VIEW_TYPE, active: false });
      changed = true;
    } else if (leaf.parent !== (group as unknown)) {
      leaf.detach();
      leaf = this.app.workspace.createLeafInParent(
        group as unknown as WorkspaceSplit,
        0,
      );
      await leaf.setViewState({ type: VIEW_TYPE, active: false });
      changed = true;
    } else if (group.children.indexOf(leaf) !== 0) {
      group.removeChild(leaf);
      (leaf as unknown as { setDimension: (dimension: null) => void }).setDimension(null);
      group.insertChild(0, leaf);
      group.recomputeChildrenDimensions();
      changed = true;
    }

    if (selectedLeaf && selectedLeaf !== leaf && group.children.includes(selectedLeaf)) {
      group.selectTab(selectedLeaf);
    }
    if (changed) this.app.workspace.requestSaveLayout();
    this.queueRender();
    return leaf;
  }

  private async activateView(): Promise<void> {
    const leaf = await this.ensureSidebarView();
    if (leaf) await this.app.workspace.revealLeaf(leaf);
  }

  private async toggleTabsAndFileExplorer(): Promise<void> {
    const tabsLeaf = await this.ensureSidebarView();
    const explorerLeaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
    if (!tabsLeaf || !explorerLeaf) return;

    const group = explorerLeaf.parent as unknown as SidebarTabGroup;
    const selectedLeaf = group.children[group.currentTab];
    const targetLeaf = selectedLeaf === tabsLeaf ? explorerLeaf : tabsLeaf;
    await this.app.workspace.revealLeaf(targetLeaf);
  }
}

class VerticalTabsSettingTab extends PluginSettingTab {
  constructor(private readonly verticalTabs: BraveTabsPlugin) {
    super(verticalTabs.app, verticalTabs);
  }

  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName("Keep Local Graph in the left sidebar")
      .setDesc("Turn on to create and keep one Local Graph at the Zen 34.76% height. Turn off to close it immediately.")
      .addToggle((toggle) => toggle
        .setValue(this.verticalTabs.ensureLocalGraph)
        .onChange((value) => this.verticalTabs.setEnsureLocalGraph(value)));

    new Setting(this.containerEl)
      .setName("Compact ribbon")
      .setDesc("Keep only the first four ribbon actions for the quieter Zen sidebar. Turn off to restore every action.")
      .addToggle((toggle) => toggle
        .setValue(this.verticalTabs.compactRibbon)
        .onChange((value) => this.verticalTabs.setCompactRibbon(value)));
  }
}

class BraveTabsView extends ItemView {
  private list: HTMLDivElement | null = null;
  private draggedLeaf: WorkspaceLeaf | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: BraveTabsPlugin,
  ) {
    super(leaf);
    this.navigation = false;
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Tabs";
  }

  getIcon(): string {
    return "panels-top-left";
  }

  protected async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass("brave-tabs-view");

    this.list = this.contentEl.createDiv({ cls: "brave-tabs-list" });

    this.renderTabs();
  }

  protected async onClose(): Promise<void> {
    this.list = null;
  }

  renderTabs(): void {
    if (!this.list) return;
    const activeLeaf = this.plugin.getActiveTabLeaf();
    const leaves = this.plugin.getOrderedLeaves();
    const splitLeaves = this.plugin.getSplitLeaves();
    const splitSet = new Set(splitLeaves);
    const firstSplitIndex = leaves.findIndex((leaf) => splitSet.has(leaf));
    this.list.empty();

    for (let index = 0; index < leaves.length; index += 1) {
      const leaf = leaves[index];
      if (splitSet.has(leaf)) {
        if (index === firstSplitIndex) {
          const splitGroup = this.list.createDiv({ cls: "brave-tabs-split-group" });
          for (const splitLeaf of splitLeaves) this.renderTab(splitLeaf, activeLeaf, splitGroup);
        }
      } else {
        this.renderTab(leaf, activeLeaf, this.list);
      }
    }

    this.list
      .querySelector<HTMLElement>(".brave-tabs-tab.is-active")
      ?.scrollIntoView({ block: "nearest" });
  }

  private renderTab(
    leaf: WorkspaceLeaf,
    activeLeaf: WorkspaceLeaf | null,
    parent: HTMLElement,
  ): void {
      const title = leaf.getDisplayText() || "New tab";
      const active = leaf === activeLeaf;
      const row = parent.createDiv({ cls: "brave-tabs-tab" });
      row.classList.toggle("is-active", active);
      row.tabIndex = 0;
      row.draggable = true;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", title);
      row.setAttribute("aria-current", active ? "page" : "false");

      row.createDiv({ cls: "brave-tabs-tab-title", text: title });
      const close = this.createIconButton(
        row,
        "x",
        `Close ${title}`,
        () => leaf.detach(),
        "brave-tabs-close",
      );
      close.addEventListener("click", (event) => event.stopPropagation());

      const activate = (): void => {
        this.plugin.activateTabSession(leaf);
      };
      row.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target === close || close.contains(event.target as Node)) return;
        const releaseRendering = this.plugin.holdRendering();
        window.addEventListener("pointerup", releaseRendering, { once: true });
        window.addEventListener("pointercancel", releaseRendering, { once: true });
        this.list?.querySelectorAll(".brave-tabs-tab").forEach((candidate) => {
          candidate.classList.toggle("is-active", candidate === row);
          candidate.setAttribute("aria-current", candidate === row ? "page" : "false");
        });
        activate();
      });
      row.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.plugin.openFullContextMenu(leaf, event);
      });
      row.addEventListener("auxclick", (event) => {
        if (event.button === 1) leaf.detach();
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
      row.addEventListener("dragstart", (event) => {
        this.draggedLeaf = leaf;
        row.classList.add("is-dragging");
        event.dataTransfer?.setData("text/plain", (leaf as unknown as { id?: string }).id ?? title);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      row.addEventListener("dragover", (event) => {
        if (!this.draggedLeaf || this.draggedLeaf === leaf) return;
        event.preventDefault();
        const after = event.clientY >= row.getBoundingClientRect().top + row.offsetHeight / 2;
        row.classList.toggle("drop-before", !after);
        row.classList.toggle("drop-after", after);
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      });
      row.addEventListener("dragleave", () => {
        row.classList.remove("drop-before", "drop-after");
      });
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        const source = this.draggedLeaf;
        const after = event.clientY >= row.getBoundingClientRect().top + row.offsetHeight / 2;
        this.clearDragState();
        if (source && source !== leaf) this.plugin.reorderLeaf(source, leaf, after);
      });
      row.addEventListener("dragend", () => this.clearDragState());
  }

  private clearDragState(): void {
    this.draggedLeaf = null;
    this.list
      ?.querySelectorAll(".is-dragging, .drop-before, .drop-after")
      .forEach((element) => element.classList.remove("is-dragging", "drop-before", "drop-after"));
  }

  private createIconButton(
    parent: HTMLElement,
    iconName: string,
    label: string,
    action: () => void,
    className = "",
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `brave-tabs-icon-button ${className}`.trim();
    button.setAttribute("aria-label", label);
    button.setAttribute("data-tooltip-position", "right");
    setIcon(button, iconName);
    button.addEventListener("click", action);
    parent.appendChild(button);
    return button;
  }

}
