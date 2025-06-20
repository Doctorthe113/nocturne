import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DarkModeToggle } from "@/components/ui/darkmodeToggle";
import ChatroomInterface from "../chatroomInterface";
import ChatroomSidebar from "../chatroomSidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";

export const dynamic = "force-dynamic";

const getMessages = cache(async (roomId: string) => {
    const prisma = new PrismaClient();
    const messages = await prisma.messages.findMany({
        where: { chatroomId: roomId },
        orderBy: { id: "asc" },
    });
    await prisma.$disconnect();
    return messages;
});

const getUserChatrooms = cache(async (userId: string) => {
    const prisma = new PrismaClient();
    const chatrooms = (
        await prisma.user.findUnique({
            where: { id: userId },
            include: { chatrooms: true },
        })
    )?.chatrooms;
    await prisma.$disconnect();
    return chatrooms;
});

export default async function Chatroom({
    params,
}: {
    params: Promise<{ roomId: string }>;
}) {
    const roomId: string = (await params).roomId;
    const sessions = await auth.api.getSession({ headers: await headers() });
    const userId = sessions?.user.id;
    const dbResponse = await getMessages(roomId);

    const oldMessages = dbResponse.map((message) => {
        return {
            id: message.id,
            user: message.author,
            message: message.content,
            file: message.file,
        };
    });

    let chatrooms;
    try {
        chatrooms = await getUserChatrooms(userId as string);
    } catch (e) {
        console.error("Failed to fetch user chatrooms:", e);
    }

    let currentChatroomName = "";
    chatrooms?.forEach((chatroom) => {
        if (chatroom.id === roomId) {
            currentChatroomName = chatroom.name;
        }
    });

    return (
        <SidebarProvider className="pb-0 h-svh w-svw">
            <ChatroomSidebar
                user={sessions?.user}
                isNew={oldMessages.length > 0 ? false : true}
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
                        <span>{currentChatroomName}</span>
                        <div className="grow h-full"></div>
                        <DarkModeToggle />
                    </header>
                    <ChatroomInterface
                        roomId={roomId}
                        user={sessions?.user}
                        oldMessages={oldMessages}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
