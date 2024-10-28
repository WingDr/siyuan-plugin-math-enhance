import {Plugin} from "siyuan";
import "./index.scss";
import { MathLive } from "./mathlive";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginMathEnhance extends Plugin {

    private customTab: () => any;
    private mathlive: MathLive;

    onload() {
        this.mathlive = new MathLive(this);        
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};
    }
    
    onunload() {
        console.log(this.i18n.byePlugin);
        if (this.mathlive) this.mathlive.unload();
    }
}
