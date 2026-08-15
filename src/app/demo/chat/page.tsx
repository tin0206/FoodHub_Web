"use client";

import { DemoChatPanel } from "@/components/chat/demo-chat-panel";
import { ForceLightTheme } from "@/components/force-light-theme";

/** Full-page fallback; landing embeds the same panel at /#demo */
export default function DemoChatPage() {
  return (
    <ForceLightTheme>
      <DemoChatPanel />
    </ForceLightTheme>
  );
}
