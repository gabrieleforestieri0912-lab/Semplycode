'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from "next/dynamic";

const Chat = dynamic(() => import("@/app/components/Chat"), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/semplycode.png" alt="Semplycode" className="w-14 h-14 rounded-xl" />
        <span className="text-gray-500 font-medium">Inizializzazione...</span>
      </div>
    </div>
  )
});

export default function ChatPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      setIsReady(true);
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  if (!isReady) {
    return (
      <div className="h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/semplycode.png" alt="Semplycode" className="w-14 h-14 rounded-xl" />
          <span className="text-gray-500 font-medium">Inizializzazione...</span>
        </div>
      </div>
    );
  }

  return <Chat />;
}