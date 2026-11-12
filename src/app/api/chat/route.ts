import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CHAT_TOOLS, runChatTool } from "@/lib/chat/tools";
import { todayIst } from "@/lib/time";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const MODEL = "claude-haiku-5-5";
const MAX_TOOL_ROUNDS = 5;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1500) }))
    .min(1)
    .max(30),
});

const SYSTEM = `You are the website assistant for Smile Cars®, a self drive car rental company in Chennai, India, serving customers for over 29 years.

Your job: help customers find a free car for their dates, explain prices and policies, and point them to the booking page. You cannot create, change or cancel bookings yourself.

Rules:
- Never guess prices, availability or policies. Always use the tools. If a tool returns an error, say so plainly.
- All dates and times are India time. Resolve words like "tomorrow" or "this Saturday" using today's date given below. If the customer gives no time, use 10:00.
- To book, give the customer the book_link from the tool result exactly as returned (a path starting with /book). They finish booking there with their address and WhatsApp number.
- Booking needs no login and no online payment. Staff call every customer to confirm, which is the verification.
- Only share a booking's status when the customer gives both the ticket number and the phone number.
- For anything you cannot help with (complaints, damage, refunds, changes to a booking), give the phone numbers or WhatsApp link from get_business_info.
- Keep answers short and friendly, suited to a phone screen: a few sentences or a short list. Use plain text, not tables or headings. Reply in the customer's language (English, Tamil or Tanglish).
- Stay on the topic of Smile Cars and car rental.`;

let client: Anthropic | null = null;
function anthropic() {
  // Reads ANTHROPIC_API_KEY from the environment. The key never reaches the browser.
  client ??= new Anthropic();
  return client;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: "The chat assistant is not set up yet. Please call or WhatsApp us." });
  }
  if (!rateLimit(`chat:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json(
      { reply: "You're sending messages quickly. Please wait a few minutes, or WhatsApp us for help." },
      { status: 429 },
    );
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Conversation must start with the user; drop any leading assistant greeting from the widget.
  const history = parsed.data.messages;
  const firstUser = history.findIndex((m) => m.role === "user");
  const messages: Anthropic.MessageParam[] = history.slice(firstUser).map((m) => ({ role: m.role, content: m.content }));
  // The model needs today's date to resolve "tomorrow", "this weekend", etc.
  const system = `${SYSTEM}\n\nToday's date in India is ${todayIst()}.`;

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic().messages.create({
        model: MODEL,
        max_tokens: 4000,
        system,
        tools: CHAT_TOOLS,
        output_config: { effort: "low" },
        messages,
      });

      if (response.stop_reason === "refusal") {
        return NextResponse.json({ reply: "Sorry, I can't help with that. For anything about your rental, please call or WhatsApp us." });
      }

      const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (response.stop_reason !== "tool_use" || toolUses.length === 0 || round === MAX_TOOL_ROUNDS) {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({
          reply: text || "Sorry, I couldn't work that out. Please call or WhatsApp us and we'll help.",
        });
      }

      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (t) => {
          try {
            return { type: "tool_result" as const, tool_use_id: t.id, content: await runChatTool(t.name, t.input) };
          } catch (err) {
            console.error(`chat tool ${t.name} failed`, err);
            return {
              type: "tool_result" as const,
              tool_use_id: t.id,
              content: "The lookup failed. Check the inputs (dates as YYYY-MM-DD, times as HH:mm) or suggest calling us.",
              is_error: true,
            };
          }
        }),
      );
      messages.push({ role: "user", content: results });
    }
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ reply: "The assistant is busy right now. Please try again in a minute or WhatsApp us." }, { status: 503 });
    }
    console.error("chat failed", err);
    return NextResponse.json({ reply: "Sorry, something went wrong. Please call or WhatsApp us." }, { status: 500 });
  }
  return NextResponse.json({ reply: "Sorry, I couldn't finish that. Please call or WhatsApp us." });
}
