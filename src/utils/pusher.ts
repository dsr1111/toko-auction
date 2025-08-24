import Pusher from 'pusher-js';

interface ItemUpdateData {
  action: 'bid' | 'added' | 'deleted';
  itemId?: number;
  timestamp: number;
}

// Pusher 클라이언트 초기화
export const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: '/api/pusher',
  auth: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// 경매 채널 구독
export const subscribeToAuctionChannel = (callback: (data: ItemUpdateData) => void) => {
  const channel = pusher.subscribe('auction-updates');
  
  channel.bind('item-updated', (data: ItemUpdateData) => {
    console.log('Pusher 이벤트 수신 (item-updated):', data);
    callback(data);
  });
  
  // 연결 상태 모니터링
  pusher.connection.bind('connected', () => {
    console.log('Pusher 연결 성공');
  });
  
  pusher.connection.bind('error', (err: any) => {
    console.error('Pusher 연결 오류:', err);
  });
  
  return () => {
    console.log('Pusher 구독 해제');
    pusher.unsubscribe('auction-updates');
  };
};

// 아이템 업데이트 알림 전송 (서버에서 호출)
export const notifyItemUpdate = async (action: 'bid' | 'added' | 'deleted', itemId?: number) => {
  try {
    const response = await fetch('/api/pusher/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: 'auction-updates',
        event: 'item-updated',
        data: {
          action,
          itemId,
          timestamp: Date.now(),
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Pusher 알림 전송 실패');
    }
    

  } catch (error) {
    console.error('❌ Pusher 알림 전송 실패:', error);
  }
};
