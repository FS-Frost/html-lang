const KEYWORD_MAP = new Map();

const KEYWORD_LET = "LET";
KEYWORD_MAP.set(KEYWORD_LET, KEYWORD_LET);

const KEYWORD_FREE = "FREE";
KEYWORD_MAP.set(KEYWORD_FREE, KEYWORD_FREE);

const KEYWORD_ADD = "ADD";
KEYWORD_MAP.set(KEYWORD_ADD, KEYWORD_ADD);

const KEYWORD_SUB = "SUB";
KEYWORD_MAP.set(KEYWORD_SUB, KEYWORD_SUB);

const KEYWORD_LOG = "LOG";
KEYWORD_MAP.set(KEYWORD_LOG, KEYWORD_LOG);

const KEYWORD_REF = "REF";
KEYWORD_MAP.set(KEYWORD_REF, KEYWORD_REF);

type StackItem = null | string | number;
type Stack = Map<string, StackItem>;

function main(): void {
    const code = document.querySelector("#code");

    if (code == null) {
        console.error("no code node to parse.");
        return;
    }

    let stack: Stack = new Map<string, StackItem>;

    for (let i = 0; i < code.childNodes.length; i++) {
        const node = code.childNodes[i] as Element;

        try {
            evaluateNode(stack, node);
        } catch (error) {
            console.error("error evaluating node:", error);
            break;
        }
    }

    console.log("Stack:", stack);
}

function evaluateNode(stack: Stack, node: Element) {
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

function handleLet(stack: Stack, node: Element) {
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
    stack.set(varName, value ?? "");
    console.log(`${KEYWORD_LET} ${varName} = ${value}`);
}

function handleFree(stack: Stack, node: Element) {
    const varName = node.getAttribute("data-name");

    if (varName == null) {
        return;
    }

    stack.delete(varName);
    console.log(`${KEYWORD_FREE} ${varName}`);
}

function filterNumberArg(varValue: StackItem) {
    const parsedValue = Number(varValue);
    if (parsedValue === Number.NaN) {
        throw `invalid ${KEYWORD_ADD} argument: ${varValue}`;
    }
    return parsedValue;
}

function handleAdd(stack: Stack, node: ChildNode) {
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

function handleSub(stack: Stack, node: ChildNode) {
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

function getOperatorArgs(stack: Stack, node: ChildNode, filter: (item: StackItem) => number) {
    const args: number[] = [];

    for (let u = 0; u < node.childNodes.length; u++) {
        const child = node.childNodes[u] as Element;
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

function handleLog(stack: Stack, node: ChildNode) {
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

function handleRef(stack: Stack, node: ChildNode) {
    const varName = getNodeValue(node);

    if (varName == null) {
        throw `invalid ${KEYWORD_REF}: ${node}`;
    }

    const varValue = stack.get(varName);
    console.log(KEYWORD_REF, varName, "=>", varValue);
    return varValue;
}

function getNodeValue(node: ChildNode) {
    return node.textContent;
}

function nodeIsValid(node: ChildNode) {
    return (node?.nodeName != "#text" && KEYWORD_MAP.get(node?.nodeName) != null);
}

function getFirstValidChild(node: ChildNode): Element | null {
    let validChild = node.firstChild;

    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (!nodeIsValid(child)) {
            continue;
        }

        validChild = child;
        break;
    }

    return validChild as Element;
}

main();
