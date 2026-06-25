import "server-only";

export type TextBeeSendResult =
  | { success: true }
  | { success: false; error: string };

export function normalizePhilippineMobileNumber(value?: string | null) {
  if (!value) return null;

  const compact = value.trim().replace(/[\s().-]/g, "");

  if (/^09\d{9}$/.test(compact)) {
    return `+63${compact.slice(1)}`;
  }

  if (/^\+639\d{9}$/.test(compact)) {
    return compact;
  }

  if (/^639\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  return null;
}

export async function sendTextBeeSms({
  phoneNumber,
  message,
}: {
  phoneNumber: string;
  message: string;
}): Promise<TextBeeSendResult> {
  const apiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;

  if (!apiKey || !deviceId) {
    return { success: false, error: "TextBee is not configured." };
  }

  try {
    const response = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          recipients: [phoneNumber],
          message,
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      return {
        success: false,
        error: `TextBee failed with HTTP ${response.status}: ${body}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "TextBee request failed.",
    };
  }
}
