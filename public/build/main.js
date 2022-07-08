"use strict";
let _keyWordCount = 0;
const KEYWORD_LET = "LET";
_keyWordCount++;
const KEYWORD_FREE = "FREE";
_keyWordCount++;
const KEYWORD_ADD = "ADD";
_keyWordCount++;
const KEYWORD_SUB = "SUB";
_keyWordCount++;
const KEYWORD_LOG = "LOG";
_keyWordCount++;
const KEYWORD_REF = "REF";
_keyWordCount++;
const newKeyWordMap = () => {
    const keywordMap = new Map([
        [KEYWORD_LET, true],
        [KEYWORD_FREE, true],
        [KEYWORD_ADD, true],
        [KEYWORD_SUB, true],
        [KEYWORD_LOG, true],
        [KEYWORD_REF, true],
    ]);
    if (keywordMap.size != _keyWordCount) {
        throw `ERROR: keyword map size (${keywordMap.size}) mismatch with defined keywords (${_keyWordCount})`;
    }
    return keywordMap;
};
const KEYWORD_MAP = newKeyWordMap();
function main() {
    const code = document.querySelector("#code");
    if (code == null) {
        console.error("no code node to parse");
        return;
    }
    let stack = new Map;
    for (let i = 0; i < code.childNodes.length; i++) {
        const node = code.childNodes[i];
        try {
            evaluateNode(stack, node);
        }
        catch (error) {
            console.error("error evaluating node:", error);
            break;
        }
    }
    console.log("Stack:", stack);
}
function evaluateNode(stack, node) {
    switch (node.nodeName) {
        case KEYWORD_LET:
            return handleLet(stack, node);
        case KEYWORD_FREE:
            return handleFree(stack, node);
        case KEYWORD_ADD:
            return handleAdd(stack, node);
        case KEYWORD_SUB:
            return handleSub(stack, node);
        case KEYWORD_LOG:
            return handleLog(stack, node);
        case KEYWORD_REF:
            return handleRef(stack, node);
        default:
            return getNodeValue(node);
    }
}
function handleLet(stack, node) {
    const varName = node.getAttribute("data-name");
    if (varName == null) {
        return;
    }
    const validChild = getFirstValidChild(node);
    if (validChild == null) {
        console.warn("no valid child for:", node);
        return;
    }
    const value = evaluateNode(stack, validChild);
    stack.set(varName, value !== null && value !== void 0 ? value : "");
    console.log(`${KEYWORD_LET} ${varName} = ${value}`);
}
function handleFree(stack, node) {
    const varName = node.getAttribute("data-name");
    if (varName == null) {
        return;
    }
    stack.delete(varName);
    console.log(`${KEYWORD_FREE} ${varName}`);
}
function filterNumberArg(varValue) {
    const parsedValue = Number(varValue);
    if (parsedValue === Number.NaN) {
        throw `invalid ${KEYWORD_ADD} argument: ${varValue}`;
    }
    return parsedValue;
}
function handleAdd(stack, node) {
    const args = getOperatorArgs(stack, node, filterNumberArg);
    let result = 0;
    let logMsg = `${KEYWORD_ADD}`;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        result += arg;
        logMsg += " " + arg;
    }
    console.info(logMsg, "=>", result);
    return result;
}
function handleSub(stack, node) {
    const args = getOperatorArgs(stack, node, filterNumberArg);
    let result = 0;
    let logMsg = `${KEYWORD_SUB}`;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        result = i == 0 ? arg : result - arg;
        logMsg += " " + arg;
    }
    console.info(logMsg, "=>", result);
    return result;
}
function getOperatorArgs(stack, node, filter) {
    const args = [];
    for (let u = 0; u < node.childNodes.length; u++) {
        const child = node.childNodes[u];
        if (child.nodeName !== "REF") {
            continue;
        }
        const varValue = evaluateNode(stack, child);
        if (varValue == null) {
            throw `invalid operator arg: ${child}`;
        }
        const parsedValue = filter(varValue);
        args.push(parsedValue);
    }
    return args;
}
function handleLog(stack, node) {
    for (let u = 0; u < node.childNodes.length; u++) {
        const child = node.childNodes[u];
        if (child.nodeName !== KEYWORD_REF) {
            continue;
        }
        const refVarName = getNodeValue(child);
        if (refVarName == null) {
            throw `invalid ${KEYWORD_REF}: ${child}`;
        }
        const refVarValue = stack.get(refVarName);
        console.log(`LOG(${refVarName}) =>`, refVarValue);
    }
    return;
}
function handleRef(stack, node) {
    const varName = getNodeValue(node);
    if (varName == null) {
        throw `invalid ${KEYWORD_REF}: ${node}`;
    }
    const varValue = stack.get(varName);
    console.log(KEYWORD_REF, varName, "=>", varValue);
    return varValue;
}
function getNodeValue(node) {
    return node.textContent;
}
function nodeIsValid(node) {
    return ((node === null || node === void 0 ? void 0 : node.nodeName) != "#text" && KEYWORD_MAP.get(node === null || node === void 0 ? void 0 : node.nodeName) != null);
}
function getFirstValidChild(node) {
    let validChild = node.firstChild;
    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (!nodeIsValid(child)) {
            continue;
        }
        validChild = child;
        break;
    }
    return validChild;
}
main();
