import {Plugin} from "siyuan";
import "./index.scss";
import { openMathlive, initMathLive, unloadStyle } from "./mathlive";
// import { MathfieldElement } from "mathlive";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    private customTab: () => any;

    async onload() {
        await mathliveDynamicImport()
        this.eventBus.on("open-noneditableblock", openMathlive);
        initMathLive()
        
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};
    }
    onunload() {
        console.log(this.i18n.byePlugin);
        this.eventBus.off("open-noneditableblock", openMathlive);
        unloadStyle();
    }
}

async function mathliveDynamicImport() {
    // 准备一个假的 "currentScript" 对象
    // 这个 src 应该是指向你的插件最终被加载的 JS 文件的 URL
    // 在思源中，它通常是 /plugins/你的插件名/index.js
    const fakeCurrentScript = {
    src: `${window.location.origin}/plugins/siyuan-plugin-math-enhance/index.js`, // <-- 把 'siyuan-plugin-math-enhance' 换成你插件的真实名称
    };

    // 保存原始的 document.currentScript 属性描述符
    const originalCurrentScript = Object.getOwnPropertyDescriptor(document, 'currentScript');

    // **【核心步骤】**：在导入 mathlive 之前，用猴子补丁篡改 document.currentScript
    Object.defineProperty(document, 'currentScript', {
    get: () => fakeCurrentScript,
    configurable: true, // 必须是可配置的，以便我们之后可以恢复它
    });

    // console.log('Monkey patch applied. Importing MathLive...');

    try {
    // 在这个被修改过的环境中动态导入 mathlive
    // 当 mathlive 内部的 IIFE 运行时，它访问 document.currentScript 将会得到我们的 fakeCurrentScript 对象
    // 它的 .src 属性是一个有效的 URL，于是 `||` 左边为真，getFileUrl() 就不会被执行！
    // 在 import 内部添加一个特殊的注释
    await import(/* webpackMode: "eager" */ 'mathlive');
    globalThis.MathfieldElement.fontsDirectory = null;
    globalThis.MathfieldElement.soundsDirectory = null;
    // console.log('MathLive imported successfully.');

    } catch (error) {
    console.error('Failed to import MathLive:', error);

    } finally {
    // **【重要】**：无论成功还是失败，都必须恢复原始的 document.currentScript
    // 以免对思源本身或其他插件造成意想不到的副作用
    // console.log('Restoring original document.currentScript...');
    if (originalCurrentScript) {
        Object.defineProperty(document, 'currentScript', originalCurrentScript);
    } else {
        // 如果原始就不存在，就删除我们添加的
        delete (document as any).currentScript;
    }
    }
}
