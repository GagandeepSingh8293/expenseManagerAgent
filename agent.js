import readline from "readline";
import Groq from "groq-sdk";
import { readFile } from "fs/promises";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});

const agentInstructions = await readFile("./AGENTS.md", "utf-8");
const expenseDB = [];
const incomeDB = [];

function askQuestion() {
    rl.setPrompt("User: ");
    rl.prompt();

    return new Promise((resolve) => {
        rl.once("line", (line) => resolve(String(line).trim()));
    });
}

function normalizeMessage(message, fallbackRole = "assistant") {
    if (!message) {
        return { role: fallbackRole, content: "" };
    }

    return {
        ...message,
        role: message.role || fallbackRole,
        content: message.content ?? "",
    };
}

async function callAgent() {
    const loadedSkills = new Set();
    const messages = [
        {
            role: "system",
            content: agentInstructions,
        }
    ];

    while (true) {
        const userInput = await askQuestion();
        if (!userInput || userInput === "bye") {
            console.log("Goodbye!");
            rl.close();
            break;
        }

        messages.push({
            role: "user",
            content: userInput,
        });

        const skillName = getSkillForInput(userInput);

        if (skillName) {
            const skillInstructions = await loadSkill(skillName);

            messages.push({
                role: "system",
                content: `You are now using the ${skillName} skill.

${skillInstructions}`,
            });
            loadedSkills.add(skillName);

            console.log(`🔧 Skill loaded: ${skillName}`);
        }

        while (true) {
            const chatCompletion = await getGroqChatCompletion(messages);
            const choice = chatCompletion.choices[0];
            if (!choice) {
                throw new Error("No response received from Groq.");
            }

            const assistantMessage = normalizeMessage(choice.message);
            messages.push(assistantMessage);
            const toolCall = assistantMessage.tool_calls;

            if (!toolCall || toolCall.length === 0) {
                console.log(`Assistant: ${assistantMessage.content || ""}`);
                break;
            }

            for (const tool of toolCall) {
                if (tool.type === "function") {
                    const functionName = tool.function.name;
                    const functionArgs = tool.function.arguments;

                    let totalExpenses;
                    if (functionName === "getTotalExpenses") {
                        totalExpenses = getTotalExpenses(JSON.parse(functionArgs));
                    }
                    if (functionName === "addExpense") {
                        totalExpenses = addExpense(JSON.parse(functionArgs));
                    }
                    if (functionName === "addIncome") {
                        totalExpenses = addIncome(JSON.parse(functionArgs));
                    }

                    messages.push({
                        role: "tool",
                        content: String(totalExpenses ?? ""),
                        tool_call_id: tool.id,
                    });
                } else {
                    console.log(`Unknown tool type: ${tool.type}`);
                }
            }
        }
    }
}

callAgent();

export async function getGroqChatCompletion(messages) {
    return groq.chat.completions.create({
        messages: messages,
        model: "openai/gpt-oss-20b",
        tools: [
            {
                type: "function",
                function: {
                    name: "getTotalExpenses",
                    description: "Get total expenses for a given time period",
                    parameters: {
                        type: "object",
                        properties: {
                            from: {
                                type: "string",
                                description: "Start date in YYYY-MM-DD format",
                            },
                            to: {
                                type: "string",
                                description: "End date in YYYY-MM-DD format",
                            },
                        },
                        required: ["from", "to"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "addExpense",
                    description: "Add a new expense",
                    parameters: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Name of the expense",
                            },
                            amount: {
                                type: "number",
                                description: "Amount of the expense",
                            },
                        },
                        required: ["name", "amount"],
                    },
                },
            },
            {
                type: "function",
                function: {
                    name: "addIncome",
                    description: "Add a new income entry to income database",
                    parameters: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Name of the income entry",
                            },
                            amount: {
                                type: "number",
                                description: "Amount of the income entry",
                            },
                        },
                        required: ["name", "amount"],
                    },
                },
            },
        ],
    });
}

/**
 * Get total expense
 */

function getTotalExpenses({ from, to }) {
    // in reality -> we call db here

    const expenses = expenseDB.reduce((total, expense) => total + expense.amount, 0);
    return expenses.toString() + ` (from ${from} to ${to})`;
}

function addExpense({ name, amount }) {
    // in reality -> we call db here
    console.log(`Adding expense: ${name} - ${amount}`);
    expenseDB.push({ name, amount });
    return 'Expense added successfully';
}

function addIncome({ name, amount }) {
    // in reality -> we call db here
    console.log(`Adding income: ${name} - ${amount}`);
    incomeDB.push({ name, amount });
    return 'Income added successfully';
}

export async function loadSkill(skillName) {
    const path = `./skills/${skillName}/SKILL.md`;

    return await readFile(path, "utf-8");
}

function getSkillForInput(userInput) {
    const input = userInput.toLowerCase();

    if (
        input.includes("expense") ||
        input.includes("spent") ||
        input.includes("spending")
    ) {
        return "expense-management";
    }

    if (
        input.includes("income") ||
        input.includes("salary") ||
        input.includes("earned")
    ) {
        return "income-management";
    }

    return null;
}