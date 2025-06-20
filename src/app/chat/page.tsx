import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DarkModeToggle } from "@/components/ui/darkmodeToggle";
import ChatroomInterface from "./chatroomInterface";
import ChatroomSidebar from "./chatroomSidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";

export default async function Chatroom() {
    const sessions = await auth.api.getSession({ headers: await headers() });
    const userId = sessions?.user.id;
    const prisma = new PrismaClient();

    let chatrooms;
    try {
        chatrooms = (
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    chatrooms: true,
                },
            })
        )?.chatrooms;
    } catch {}

    prisma.$disconnect();

    return (
        <SidebarProvider className="pb-0 h-svh w-svw">
            <ChatroomSidebar
                user={sessions?.user}
                isNew={true}
                oldChatrooms={chatrooms as any}
            />
            <SidebarInset className="!mb-0 !rounded-b-none !rounded-lg min-h-0 flex flex-col">
                <div className="rounded-lg m-2 mb-0 grow flex flex-col p-0 min-h-0">
                    <header className="z-10 shadow-background group-has-data-[collapsible=icon]/sidebar-wrapper:h-8 flex h-8 shrink-0 items-center gap-2 transition-[width,height] ease-linear mb-2">
                        <SidebarTrigger />
                        <Separator
                            orientation="vertical"
                            className="mx-0 data-[orientation=vertical]:h-4"
                        />
                        <div className="grow h-full"></div>
                        <DarkModeToggle />
                    </header>
                    <ChatroomInterface
                        roomId={undefined}
                        user={sessions?.user as any}
                        oldMessages={[]}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
