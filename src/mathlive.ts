import { MathfieldElement } from "mathlive";
import PluginMathEnhance from "./index";
import { isMobile } from "./utils";

declare global {
    const mathVirtualKeyboard: any;
    const MathfieldElement:any;
}

export class MathLive {
    public mf: MathfieldElement;

    constructor(private plugin: PluginMathEnhance) {
        MathfieldElement.fontsDirectory = null;
        MathfieldElement.soundsDirectory = null;
        if (!customElements.get("math-field")) {
            customElements.define("math-field", MathfieldElement);
        }
        try {
            this.mf = new MathfieldElement();
            this.mf.smartMode = true;
        }
        finally {
            this.plugin.eventBus.on("open-noneditableblock", this.open.bind(this));
            initStyle();
        }
    }

    public unload() {
        this.plugin.eventBus.off("open-noneditableblock", this.open.bind(this));
    }

    public open({detail}: any) {
        const protyleUtil = detail["toolbar"]["subElement"] as HTMLElement;
        // console.log(protyleUtil)
        const title = protyleUtil.querySelector(".fn__flex-1.resize__move") as HTMLElement;
        // console.log(title)
        const innerText = title.innerText;
        if (innerText === (window as any).siyuan.languages["inline-math"] || innerText === (window as any).siyuan.languages["math"]){
            console.log("捕获点击数学公式事件");
            this.renderMathLive(false, protyleUtil);
        }
    }

    private renderMathLive(naiveDom:boolean,originMathBlock:HTMLElement,debug=false){
        // 白天黑夜模式，0是白，1是黑，设置不同的高亮显示
        const mode = (window as any).siyuan.config.appearance.mode;
        document.body.style.setProperty("--contains-highlight-background-color", mode ? "hsl(212, 40%, 30%)" : "hsl(212, 40%, 90%)");
        const textBlock = originMathBlock.querySelector(":scope > div");
        const latexBlock:HTMLTextAreaElement|null = originMathBlock.querySelector(":scope > div > textarea");
    
        if (!textBlock ||  !latexBlock){
            console.log("renderMathLive 初始化获得输入框元素错误！");
            console.log(`textBlock ${textBlock} ||  latexBlock ${latexBlock} `);
            return;
        }
    
        if (debug===true){
            console.log("renderMathLive 初始化获得输入框元素成功！");
            console.log(`textBlock ${textBlock} ||  latexBlock ${latexBlock} `);
        }
    
        const dyBlock = document.createElement("div");
        dyBlock.id = "mathEnhanceDyBlock";
        this.mf = this.initMathLiveBlock(latexBlock);
        const keyboardBlock = this.initkeyboardBlock();
        
    
        if (naiveDom === true){
            console.log("启动原生渲染！");
            dyBlock.appendChild(this.mf);
        }
        else{
            dyBlock.appendChild(this.mf); 
        }
        textBlock.appendChild(dyBlock);
        textBlock.appendChild(keyboardBlock);
    
        this.initMacros();
        this.addShortcut();
        this.addMathLiveListener(latexBlock);
    }

    private initMathLiveBlock(latexBlock:HTMLTextAreaElement):MathfieldElement{
        const mathLiveBlock:MathfieldElement = document.createElement("math-field") as MathfieldElement;
        // 初始化样式
        mathLiveBlock.style.cssText = `
        width: -webkit-fill-available; 
        font-size: 1.7em; 
        color: var(--b3-protyle-inline-strong-color); 
        background-color: var(--b3-theme-background);
        `;
        // mathLiveBlock.style.fontSize = "1.25em";
        
        mathLiveBlock.value = latexBlock.value;
        return mathLiveBlock;
    }

    private initkeyboardBlock():HTMLElement{
        const keyboardBlock = document.createElement("div");
        keyboardBlock.style.height = "auto";
        if (!isMobile) mathVirtualKeyboard.container = keyboardBlock;
        return keyboardBlock;
    }

    private initMacros(){
        this.mf.macros = {
            ...this.mf.macros,
            mark: {
                args: 1,
                def: "{\\color{#6495ed}#1}",
                captureSelection: false,
            },
            rm: "\\mathrm#1",
        };
        const tempMacro = JSON.parse((window as any).siyuan.config.editor.katexMacros || "{}");
        tempMacro["\\placeholder"] = "\\phantom";
        tempMacro["\\ensuremath"] = "#1";
        (window as any).siyuan.config.editor.katexMacros = JSON.stringify(tempMacro);
    }

    private addShortcut(){
        this.mf.keybindings = removeObjByPropertyVal(this.mf.keybindings, "key","alt+d");
        this.mf.keybindings = [
            ...this.mf.keybindings,
            {
                "key": "alt+d",
                "ifMode": "math",
                "command": [
                    "insert",
                    "\\mark{#@}"
                ]
            }
        ];
    }

    private addMathLiveListener(latexBlock:HTMLTextAreaElement,){
        let tempLatex = this.mf.value;
        let liveCall = false;
        //初始化输入事件
        const evt =  new Event("input", {
            bubbles: true,
            cancelable: true
          });
        this.mf.addEventListener("input", () => {
            //替换标记宏
            const expendLatex = this.mf.getValue("latex-expanded");
            
            latexBlock.value = expendLatex.replace(/\{\\textcolor\{#6495ed\}\{(.+?)\}\}/g, "\\mark{$1}").replace(/\\textcolor\{#6495ed\}\{(.+?)\}/g, "\\mark{$1}");
            if (tempLatex === this.mf.value) {
                tempLatex = this.mf.value;
                // console.log(tempLatex)
                return;
            }
            tempLatex = this.mf.value;
            liveCall = true;
            latexBlock.dispatchEvent(evt);
        });
    
        latexBlock.addEventListener("input", (ev) => {
            if (liveCall === true){
                liveCall = false;
                return;
            }
            this.mf.setValue(latexBlock.value);
        }
        );
    }

}

function initStyle() {
    const mathlive_css = document.createElement("style");
    mathlive_css.id = "mathEnhance";
    mathlive_css.innerHTML = `
#mathlive-suggestion-popover{
    z-index: 200 !important;
}
.ML__keyboard.is-visible{
    height: calc(var(--_keyboard-height) + 10px);
    --keyboard-background: var(--b3-theme-background-light);
    --keyboard-toolbar-text-active: var(--b3-theme-primary);
    --keyboard-toolbar-text: var(--b3-theme-on-background);
    --keycap-text: var(--b3-theme-on-background);
    --keycap-background: var(--b3-theme-background);
    --_variant-panel-background: var(--b3-theme-background-light);
}
.bigfnbutton {
    margin-bottom: 3px;
}
.MLK__keycap {
    margin-bottom: 3px;
}
.MLK__backdrop {
    height: calc(var(--keyboard-height) + 10px);
}

.MLK__rows .bottom {
    justify-content: center !important;
    align-items: center !important;
    padding: 0px;
}

@-moz-document url-prefix() {
    .MLK__rows > .row div {
        width: calc(min(var(--_keycap-max-width), 9%) - var(--_keycap-gap)) !important;
    }

    .MLK__rows > .row .w20{
        width: calc(2 * min(var(--_keycap-max-width), 9%) - var(--_keycap-gap)) !important;
    }

    .MLK__rows > .row .w15{
        width: calc(1.5 * min(var(--_keycap-max-width), 9%) - var(--_keycap-gap)) !important;
    }

    .MLK__rows {
        width: -moz-available !important;
        border-bottom: calc(min(2px, var(--_keycap-max-width)))
    }

    math-field {
        width: -moz-available !important;
    }
}
`;
    if (isMobile){
        mathlive_css.innerHTML = mathlive_css.innerHTML+
        `
        .ML__keyboard.is-visible{
            top: 50%;
        }`;
    }
    document.head.appendChild(mathlive_css);
    // document.body.style.setProperty("--keycap-height", "3em");
    document.body.style.setProperty("--keycap-font-size", "1.2em");
}

function removeObjByPropertyVal(objList:any,propName:string, propVal:any) { // propName为要判断的属性名，propVal为要判断的属性值
    for (let i = 0; i < objList.length; i++) {
      if (objList[i][propName] == propVal) { // 判断该属性值是否符合要求
        objList.splice(i, 1); // 使用splice()方法删除该object
        i--; // 因为删除后后面的元素会向前移动，所以要将i减1
      }
    }
    return objList;
}
  