import { Sidebar } from "@/components/layout/Sidebar";
import { AIAssistant } from "@/components/ai-assistant";
import { AIAssistantProvider } from "@/components/providers/AIAssistantContext";
import { PresenceProvider } from "@/components/providers/PresenceProvider";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AIAssistantProvider>
      <PresenceProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {children}
          </main>
          <AIAssistant />
        </div>
      </PresenceProvider>
    </AIAssistantProvider>
  );
}
