'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';

const Chat = dynamic(() => import('@/app/components/Chat'), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/semplycode.png"
          alt="Semplycode"
          width={56}
          height={56}
          className="rounded-xl"
          loading="eager"
        />
        <span className="text-gray-500 font-medium">Inizializzazione...</span>
      </div>
    </div>
  ),
});

export default function ChatPage() {
  return <Chat />;
}
