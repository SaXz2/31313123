let _locale = "en";
let _translations = {};
function setupL10N(locale, builtinTranslations) {
  _locale = locale;
  _translations = builtinTranslations;
}
function t(key, args, locale) {
  var _a;
  const template = ((_a = _translations[locale ?? _locale]) == null ? void 0 : _a[key]) ?? key;
  return template;
}
typeof window !== "undefined" && navigator.userAgent.includes("Mac OS X");
function getMirrorId(id) {
  var _a, _b;
  const block = orca.state.blocks[id];
  if (block == null) return id;
  const repr = (_b = (_a = block == null ? void 0 : block.properties) == null ? void 0 : _a.find((p) => p.name === "_repr")) == null ? void 0 : _b.value;
  if (repr == null) return id;
  if (repr.type === "mirror") return repr.mirroredId;
  return id;
}
const zhCN = {
  "Task tag name": "任务标签名称",
  "The name of the tag that is used to identify tasks.": "用于识别任务的标签名称。",
  "Status property name": "状态属性名称",
  "The name of the property that stores the status of a task.": "用于存储任务状态的属性名称。",
  "Todo status value": "待办状态值",
  "The value of the status property that represents a task that is not started yet.": "表示尚未开始的任务的状态属性值。",
  "Doing status value": "进行中状态值",
  "The value of the status property that represents a task that is in progress.": "表示进行中的任务的状态属性值。",
  "Done status value": "已完成状态值",
  "The value of the status property that represents a task that is completed.": "表示已完成的任务的状态属性值。",
  "Start time property name": "开始时间属性名称",
  "The name of the property that stores the start time of a task.": "用于存储任务开始时间的属性名称。",
  "End time property name": "结束时间属性名称",
  "The name of the property that stores the end time of a task.": "用于存储任务结束时间的属性名称。",
  "Make block a task and cycle its status": "将块标记为任务并循环其状态"
};
const { subscribe } = window.Valtio;
let pluginName;
let unsubscribe;
let prevTaskTagName;
const statusState = /* @__PURE__ */ new Map();
async function load(_name) {
  pluginName = _name;
  setupL10N(orca.state.locale, { "zh-CN": zhCN });
  await orca.plugins.setSettingsSchema(pluginName, {
    taskName: {
      label: t("Task tag name"),
      description: t("The name of the tag that is used to identify tasks."),
      type: "string",
      defaultValue: "Task"
    },
    statusName: {
      label: t("Status property name"),
      description: t(
        "The name of the property that stores the status of a task."
      ),
      type: "string",
      defaultValue: "Status"
    },
    statusTodo: {
      label: t("Todo status value"),
      description: t(
        "The value of the status property that represents a task that is not started yet."
      ),
      type: "string",
      defaultValue: "TODO"
    },
    statusDoing: {
      label: t("Doing status value"),
      description: t(
        "The value of the status property that represents a task that is in progress."
      ),
      type: "string",
      defaultValue: "Doing"
    },
    statusDone: {
      label: t("Done status value"),
      description: t(
        "The value of the status property that represents a task that is completed."
      ),
      type: "string",
      defaultValue: "Done"
    },
    startTimeName: {
      label: t("Start time property name"),
      description: t(
        "The name of the property that stores the start time of a task."
      ),
      type: "string",
      defaultValue: "Start time"
    },
    endTimeName: {
      label: t("End time property name"),
      description: t(
        "The name of the property that stores the end time of a task."
      ),
      type: "string",
      defaultValue: "End time"
    }
  });
  prevTaskTagName = orca.state.plugins[pluginName].settings.taskName;
  await readyTag();
  injectStyles();
  unsubscribe = subscribe(orca.state.plugins[pluginName], async () => {
    if (orca.state.plugins[pluginName].settings) {
      await readyTag(true);
      removeStyles();
      injectStyles();
    } else {
      removeStyles();
    }
  });
  if (orca.state.commands[`${pluginName}.cycleTaskStatus`] == null) {
    orca.commands.registerEditorCommand(
      `${pluginName}.cycleTaskStatus`,
      async ([, , cursor], id) => {
        var _a, _b, _c, _d, _e, _f;
        if (cursor.anchor !== cursor.focus) return null;
        const settings = orca.state.plugins[pluginName].settings;
        const blockId = getMirrorId(id ?? cursor.anchor.blockId);
        const block = orca.state.blocks[blockId];
        if (block == null) return null;
        const tagRef = block.refs.find(
          (r) => r.type === 2 && r.alias === settings.taskName
        );
        if (tagRef == null) {
          await orca.commands.invokeEditorCommand(
            "core.editor.insertTag",
            cursor,
            blockId,
            settings.taskName,
            [
              { name: settings.statusName, value: settings.statusTodo },
              { name: settings.startTimeName, value: null },
              { name: settings.endTimeName, value: null }
            ]
          );
        } else {
          const currStatus = ((_b = (_a = tagRef.data) == null ? void 0 : _a.find((d) => d.name === settings.statusName)) == null ? void 0 : _b.value) ?? "";
          const nextStatus = statusState.get(currStatus);
          const currStartTime = (_d = (_c = tagRef.data) == null ? void 0 : _c.find(
            (d) => d.name === settings.startTimeName
          )) == null ? void 0 : _d.value;
          const currEndTime = (_f = (_e = tagRef.data) == null ? void 0 : _e.find(
            (d) => d.name === settings.endTimeName
          )) == null ? void 0 : _f.value;
          await orca.commands.invokeEditorCommand(
            "core.editor.insertTag",
            cursor,
            blockId,
            settings.taskName,
            [
              { name: settings.statusName, value: nextStatus },
              {
                name: settings.startTimeName,
                type: 5,
                value: nextStatus === settings.statusDoing ? /* @__PURE__ */ new Date() : currStartTime
              },
              {
                name: settings.endTimeName,
                type: 5,
                value: nextStatus === settings.statusDone ? /* @__PURE__ */ new Date() : currEndTime
              }
            ]
          );
        }
        return null;
      },
      () => {
      },
      { label: t("Make block a task and cycle its status") }
    );
  }
  if (orca.state.shortcuts[`${pluginName}.cycleTaskStatus`] == null) {
    orca.shortcuts.assign("alt+enter", `${pluginName}.cycleTaskStatus`);
  }
  document.body.addEventListener("click", onClick);
  console.log(`${pluginName} loaded.`);
}
async function unload() {
  unsubscribe();
  removeStyles();
  orca.shortcuts.reset(`${pluginName}.cycleTaskStatus`);
  orca.commands.unregisterEditorCommand(`${pluginName}.cycleTaskStatus`);
  document.body.removeEventListener("click", onClick);
  console.log(`${pluginName} unloaded.`);
}
async function readyTag(isUpdate = false) {
  const settings = orca.state.plugins[pluginName].settings;
  statusState.clear();
  statusState.set("", settings.statusTodo);
  statusState.set(settings.statusTodo, settings.statusDoing);
  statusState.set(settings.statusDoing, settings.statusDone);
  statusState.set(settings.statusDone, settings.statusTodo);
  if (settings.taskName !== prevTaskTagName) {
    const { id: oldTaskId } = await orca.invokeBackend("get-blockid-by-alias", prevTaskTagName) ?? {};
    if (oldTaskId) {
      try {
        await orca.commands.invokeEditorCommand(
          "core.editor.deleteBlocks",
          null,
          [oldTaskId]
        );
      } catch (err) {
      }
    }
  }
  let { id: taskBlockId } = await orca.invokeBackend("get-blockid-by-alias", settings.taskName) ?? {};
  const nonExistent = taskBlockId == null;
  if (nonExistent) {
    await orca.commands.invokeGroup(async () => {
      taskBlockId = await orca.commands.invokeEditorCommand(
        "core.editor.insertBlock",
        null,
        null,
        null,
        [{ t: "t", v: settings.taskName }]
      );
      await orca.commands.invokeEditorCommand(
        "core.editor.createAlias",
        null,
        settings.taskName,
        taskBlockId
      );
      prevTaskTagName = settings.taskName;
    });
  }
  if (isUpdate || nonExistent) {
    await orca.commands.invokeEditorCommand(
      "core.editor.setProperties",
      null,
      [taskBlockId],
      [
        {
          name: settings.statusName,
          type: 6,
          typeArgs: {
            subType: "single",
            choices: [
              settings.statusTodo,
              settings.statusDoing,
              settings.statusDone
            ]
          }
        },
        {
          name: settings.startTimeName,
          type: 5,
          typeArgs: { subType: "datetime" }
        },
        {
          name: settings.endTimeName,
          type: 5,
          typeArgs: { subType: "datetime" }
        }
      ]
    );
  }
}
function injectStyles() {
  const settings = orca.state.plugins[pluginName].settings;
  const taskTagName = settings.taskName.toLowerCase();
  const statusPropName = settings.statusName.replace(/ /g, "-").toLowerCase();
  const statusTodoValue = settings.statusTodo;
  const statusDoingValue = settings.statusDoing;
  const statusDoneValue = settings.statusDone;
  const styles = `
    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"])::before {
      font-family: "tabler-icons";
      speak: none;
      font-style: normal;
      font-weight: normal;
      font-variant: normal;
      text-transform: none;
      -webkit-font-smoothing: antialiased;
      margin-right: var(--orca-spacing-md);
      cursor: pointer;
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusTodoValue}"])::before {
      content: "\\ed27";
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoingValue}"])::before {
      content: "\\fa0d";
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoneValue}"])::before {
      content: "\\f704";
    }

    .orca-repr-main-content:has(>.orca-tags>.orca-tag[data-name="${taskTagName}"][data-${statusPropName}="${statusDoneValue}"]) {
      opacity: 0.75;
    }
  `;
  const styleEl = document.createElement("style");
  styleEl.dataset.role = pluginName;
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
}
function removeStyles() {
  const styleEls = document.querySelectorAll(`style[data-role="${pluginName}"]`);
  styleEls.forEach((el) => el.remove());
}
function onClick(e) {
  var _a;
  const target = e.target;
  if (!(target == null ? void 0 : target.classList.contains("orca-repr-main-content"))) return;
  const rect = target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x < 0 || x > 18 || y < 0 || y > 18) return;
  const settings = orca.state.plugins[pluginName].settings;
  const parent = target.parentElement;
  if ((parent == null ? void 0 : parent.querySelector(
    `.orca-tag[data-name="${settings.taskName.toLowerCase()}"]`
  )) == null)
    return;
  const blockId = (_a = parent.closest(".orca-block")) == null ? void 0 : _a.dataset.id;
  if (blockId == null) return;
  orca.commands.invokeEditorCommand(
    `${pluginName}.cycleTaskStatus`,
    null,
    blockId
  );
}
export {
  load,
  unload
};
