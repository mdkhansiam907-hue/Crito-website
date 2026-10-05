/* ==========================================
   SCIENTIFIC CALCULATOR
========================================== */


/* ==========================================
   DOM ELEMENTS
========================================== */

const expressionDisplay =
    document.getElementById("expression");

const resultDisplay =
    document.getElementById("result");

const angleModeButton =
    document.getElementById("angleMode");

const historyList =
    document.getElementById("historyList");

const clearHistoryButton =
    document.getElementById("clearHistory");

const buttons =
    document.querySelectorAll(".btn");


/* ==========================================
   STATE
========================================== */

let expression = "";
let lastAnswer = 0;

let angleMode = "DEG";

let history = [];


/* ==========================================
   DISPLAY
========================================== */

function updateDisplay() {

    expressionDisplay.textContent =
        expression || "0";

    resultDisplay.textContent =
        expression ? previewResult() : "0";
}


/* ==========================================
   ANGLE MODE
========================================== */

angleModeButton.addEventListener("click", () => {

    angleMode =
        angleMode === "DEG"
            ? "RAD"
            : "DEG";

    angleModeButton.textContent =
        angleMode;

    updateDisplay();
});


/* ==========================================
   BUTTON HANDLING
========================================== */

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const value =
            button.dataset.value;

        const action =
            button.dataset.action;

        if (action === "clear") {

            clearCalculator();

        } else if (action === "delete") {

            deleteLast();

        } else if (action === "calculate") {

            calculate();

        } else if (value) {

            addToExpression(value);
        }
    });

});


/* ==========================================
   ADD TO EXPRESSION
========================================== */

function addToExpression(value) {

    if (expression === "Error") {
        expression = "";
    }

    expression += value;

    updateDisplay();
}


/* ==========================================
   CLEAR
========================================== */

function clearCalculator() {

    expression = "";

    resultDisplay.textContent = "0";

    updateDisplay();
}


/* ==========================================
   DELETE
========================================== */

function deleteLast() {

    if (!expression) return;

    /*
       Delete complete function names
       such as sin(, sqrt( etc.
    */

    const functions = [
        "sqrt(",
        "asin(",
        "acos(",
        "atan(",
        "sin(",
        "cos(",
        "tan(",
        "log(",
        "ln("
    ];

    for (const func of functions) {

        if (expression.endsWith(func)) {

            expression =
                expression.slice(
                    0,
                    -func.length
                );

            updateDisplay();

            return;
        }
    }

    expression =
        expression.slice(0, -1);

    updateDisplay();
}


/* ==========================================
   PREVIEW
========================================== */

function previewResult() {

    try {

        return formatNumber(
            evaluateExpression(expression)
        );

    } catch {

        return "...";
    }
}


/* ==========================================
   CALCULATE
========================================== */

function calculate() {

    if (!expression) return;

    try {

        const originalExpression =
            expression;

        const result =
            evaluateExpression(expression);

        if (!Number.isFinite(result)) {
            throw new Error("Invalid result");
        }

        lastAnswer = result;

        resultDisplay.textContent =
            formatNumber(result);

        addHistory(
            originalExpression,
            result
        );

        /*
           Keep the result as the current
           expression so users can continue.
        */

        expression =
            String(result);

        expressionDisplay.textContent =
            originalExpression;

    } catch (error) {

        expressionDisplay.textContent =
            expression;

        resultDisplay.textContent =
            "Error";
    }
}


/* ==========================================
   EXPRESSION EVALUATOR
========================================== */

function evaluateExpression(input) {

    let exp = input;

    /*
       Replace constants
    */

    exp = exp.replace(
        /π/g,
        "Math.PI"
    );

    exp = exp.replace(
        /\be\b/g,
        "Math.E"
    );

    /*
       Previous answer
    */

    exp = exp.replace(
        /\bAns\b/g,
        `(${lastAnswer})`
    );


    /*
       Percentage
       50% => (50/100)
    */

    exp = exp.replace(
        /(\d+(?:\.\d+)?)%/g,
        "($1/100)"
    );


    /*
       Factorial
    */

    exp = convertFactorials(exp);


    /*
       Power
    */

    exp = exp.replace(
        /\^/g,
        "**"
    );


    /*
       Square root
    */

    exp = exp.replace(
        /sqrt\(/g,
        "Math.sqrt("
    );


    /*
       Natural logarithm
    */

    exp = exp.replace(
        /ln\(/g,
        "Math.log("
    );


    /*
       Base-10 logarithm
    */

    exp = exp.replace(
        /log\(/g,
        "Math.log10("
    );


    /*
       Trigonometry
    */

    if (angleMode === "DEG") {

        exp = exp.replace(
            /sin\(/g,
            "Math.sin(degToRad("
        );

        exp = exp.replace(
            /cos\(/g,
            "Math.cos(degToRad("
        );

        exp = exp.replace(
            /tan\(/g,
            "Math.tan(degToRad("
        );

        /*
           Inverse trig
        */

        exp = exp.replace(
            /asin\(/g,
            "radToDeg(Math.asin("
        );

        exp = exp.replace(
            /acos\(/g,
            "radToDeg(Math.acos("
        );

        exp = exp.replace(
            /atan\(/g,
            "radToDeg(Math.atan("
        );

    } else {

        exp = exp.replace(
            /asin\(/g,
            "Math.asin("
        );

        exp = exp.replace(
            /acos\(/g,
            "Math.acos("
        );

        exp = exp.replace(
            /atan\(/g,
            "Math.atan("
        );

        exp = exp.replace(
            /sin\(/g,
            "Math.sin("
        );

        exp = exp.replace(
            /cos\(/g,
            "Math.cos("
        );

        exp = exp.replace(
            /tan\(/g,
            "Math.tan("
        );
    }


    /*
       Safety check

       Only allow characters required
       for mathematical expressions.
    */

    if (
        /[^0-9+\-*/().,\sA-Za-z_]/.test(exp)
    ) {
        throw new Error("Invalid characters");
    }


    /*
       Block dangerous JavaScript globals
    */

    const forbidden = [
        "constructor",
        "window",
        "document",
        "globalThis",
        "Function",
        "eval"
    ];

    forbidden.forEach(word => {

        if (
            exp.toLowerCase()
                .includes(word.toLowerCase())
        ) {
            throw new Error("Invalid expression");
        }
    });


    /*
       Evaluate expression.

       Math functions are explicitly supplied
       to the generated function.
    */

    const fn = new Function(
        "degToRad",
        "radToDeg",
        `
        "use strict";
        return (${exp});
        `
    );

    const value =
        fn(degToRad, radToDeg);


    if (
        typeof value !== "number" ||
        !Number.isFinite(value)
    ) {
        throw new Error("Invalid result");
    }

    return value;
}


/* ==========================================
   ANGLE CONVERSION
========================================== */

function degToRad(degrees) {

    return degrees *
        Math.PI / 180;
}


function radToDeg(radians) {

    return radians *
        180 / Math.PI;
}


/* ==========================================
   FACTORIAL
========================================== */

function factorial(number) {

    if (!Number.isFinite(number)) {
        throw new Error("Invalid factorial");
    }

    if (number < 0) {
        throw new Error("Negative factorial");
    }

    if (!Number.isInteger(number)) {
        throw new Error("Factorial requires integer");
    }

    /*
       Prevent extremely large calculations.
    */

    if (number > 170) {
        throw new Error("Number too large");
    }

    let result = 1;

    for (let i = 2; i <= number; i++) {

        result *= i;
    }

    return result;
}


/*
   Convert:

   5!
   5!!
   (5+2)!

   into factorial(...) calls.
*/

function convertFactorials(exp) {

    let previous;

    do {

        previous = exp;

        /*
           Parenthesized factorial
        */

        exp = exp.replace(
            /(\([^()]*\))!/g,
            "factorial($1)"
        );

        /*
           Simple number factorial
        */

        exp = exp.replace(
            /(\d+(?:\.\d+)?)!/g,
            "factorial($1)"
        );

    } while (exp !== previous);


    /*
       Since factorial is used inside
       the generated function, provide
       it as a global-safe replacement.
    */

    exp = exp.replace(
        /factorial\(/g,
        "factorial("
    );

    return exp;
}


/* ==========================================
   NUMBER FORMATTING
========================================== */

function formatNumber(number) {

    if (!Number.isFinite(number)) {
        return "Error";
    }

    /*
       Avoid ugly floating point values.
       Example:
       0.30000000000000004 -> 0.3
    */

    const rounded =
        Number.parseFloat(
            number.toPrecision(12)
        );

    return rounded.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 10
        }
    );
}


/* ==========================================
   HISTORY
========================================== */

function addHistory(
    calculation,
    result
) {

    history.unshift({
        expression: calculation,
        result: result
    });


    /*
       Keep only the latest 30
       calculations.
    */

    if (history.length > 30) {

        history.pop();
    }

    renderHistory();
}


/* ==========================================
   RENDER HISTORY
========================================== */

function renderHistory() {

    if (history.length === 0) {

        historyList.innerHTML = `
            <div class="empty-history">
                <span>⌁</span>
                <p>No calculations yet</p>
            </div>
        `;

        return;
    }


    historyList.innerHTML =
        history.map(
            (item, index) => `

            <div
                class="history-item"
                data-history-index="${index}"
            >

                <div class="history-expression">
                    ${escapeHTML(item.expression)}
                </div>

                <div class="history-result">
                    = ${escapeHTML(
                        formatNumber(item.result)
                    )}
                </div>

            </div>
        `
        ).join("");


    /*
       Click history item to reuse it.
    */

    document
        .querySelectorAll(".history-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            item.dataset
                                .historyIndex
                        );

                    expression =
                        history[index]
                            .expression;

                    updateDisplay();
                }
            );

        });
}


/* ==========================================
   CLEAR HISTORY
========================================== */

clearHistoryButton.addEventListener(
    "click",
    () => {

        history = [];

        renderHistory();
    }
);


/* ==========================================
   HTML ESCAPE
========================================== */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================
   KEYBOARD SUPPORT
========================================== */

document.addEventListener(
    "keydown",
    event => {

        const key = event.key;


        /*
           Numbers
        */

        if (/^[0-9.]$/.test(key)) {

            addToExpression(key);

            return;
        }


        /*
           Operators
        */

        if (
            ["+", "-", "*", "/", "^"].includes(key)
        ) {

            addToExpression(key);

            return;
        }


        /*
           Parentheses
        */

        if (key === "(" || key === ")") {

            addToExpression(key);

            return;
        }


        /*
           Percentage
        */

        if (key === "%") {

            addToExpression("%");

            return;
        }


        /*
           Enter
        */

        if (
            key === "Enter" ||
            key === "="
        ) {

            event.preventDefault();

            calculate();

            return;
        }


        /*
           Backspace
        */

        if (key === "Backspace") {

            event.preventDefault();

            deleteLast();

            return;
        }


        /*
           Escape
        */

        if (key === "Escape") {

            clearCalculator();

            return;
        }


        /*
           Keyboard shortcuts
        */

        const shortcuts = {

            "p": "π",

            "e": "e"
        };


        if (shortcuts[key]) {

            addToExpression(
                shortcuts[key]
            );
        }
    }
);


/* ==========================================
   INITIALIZE
========================================== */

updateDisplay();
renderHistory();