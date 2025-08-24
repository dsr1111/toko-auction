"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ItemCard from './ItemCard';
import AddItemCard from './AddItemCard';
import { useSession } from 'next-auth/react';
import { subscribeToAuctionChannel } from '@/utils/pusher';

type Item = {
  id: number;
  name: string;
  price: number;
  current_bid: number;
  last_bidder_nickname: string | null;
  created_at: string;
  end_time: string | null;
};

interface ExtendedUser {
  name?: string | null;
  image?: string | null;
  displayName?: string;
  isAdmin?: boolean;
}

export default function AuctionItems({ onItemAdded }: { onItemAdded?: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      // 마감된 아이템을 뒤로 보내기 위한 정렬
      if (data) {
        const now = new Date().getTime();
        const sortedData = data.sort((a, b) => {
          const aEnded = a.end_time ? new Date(a.end_time).getTime() <= now : false;
          const bEnded = b.end_time ? new Date(b.end_time).getTime() <= now : false;
          
          // 마감되지 않은 아이템을 앞으로, 마감된 아이템을 뒤로
          if (aEnded && !bEnded) return 1;
          if (!aEnded && bEnded) return -1;
          
          // 둘 다 마감되었거나 둘 다 진행 중인 경우, 생성일 기준으로 정렬
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setItems(sortedData);
      } else {
        setItems([]);
      }

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '아이템을 불러오는데 실패했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 스마트 업데이트: 특정 아이템만 업데이트
  const updateSingleItem = useCallback(async (itemId: number) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) {
        console.error('아이템 개별 업데이트 실패:', error);
        return;
      }

      if (data) {
        setItems(prevItems => {
          const updatedItems = prevItems.map(item => 
            item.id === itemId ? data : item
          );
          
          // 업데이트 후에도 마감된 아이템을 뒤로 보내기
          const now = new Date().getTime();
          return updatedItems.sort((a, b) => {
            const aEnded = a.end_time ? new Date(a.end_time).getTime() <= now : false;
            const bEnded = b.end_time ? new Date(b.end_time).getTime() <= now : false;
            
            if (aEnded && !bEnded) return 1;
            if (!aEnded && bEnded) return -1;
            
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        });
      }
    } catch (err) {
      console.error('아이템 업데이트 중 오류:', err);
    }
  }, [supabase]);

  // Pusher로 실시간 업데이트 (스마트 업데이트)
  useEffect(() => {
    const unsubscribe = subscribeToAuctionChannel((data: { action: string; itemId?: number; timestamp: number }) => {
      console.log('Pusher 이벤트 수신:', data); // 디버깅용 로그
      
      if (data.action === 'bid' && data.itemId) {
        // 입찰 업데이트: 해당 아이템만 업데이트 (깜빡임 없음)
        console.log('입찰 업데이트:', data.itemId);
        updateSingleItem(data.itemId);
      } else if (data.action === 'added' || data.action === 'deleted') {
        // 추가/삭제: 전체 목록 새로고침 (필요한 경우만)
        console.log('아이템 추가/삭제:', data.action);
        fetchItems();
      }
    });
    
    // 컴포넌트 언마운트 시 구독 해제
    return unsubscribe;
  }, [fetchItems, updateSingleItem]);

  // 실시간 구독을 위한 Supabase Realtime 설정
  useEffect(() => {
    const channel = supabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        (payload) => {
          console.log('Supabase Realtime 이벤트:', payload);
          
          if (payload.eventType === 'UPDATE') {
            // 개별 아이템 업데이트
            const updatedItem = payload.new as Item;
            setItems(prevItems => {
              const updatedItems = prevItems.map(item => 
                item.id === updatedItem.id ? updatedItem : item
              );
              
              // 마감된 아이템을 뒤로 보내기
              const now = new Date().getTime();
              return updatedItems.sort((a, b) => {
                const aEnded = a.end_time ? new Date(a.end_time).getTime() <= now : false;
                const bEnded = b.end_time ? new Date(b.end_time).getTime() <= now : false;
                
                if (aEnded && !bEnded) return 1;
                if (!aEnded && bEnded) return -1;
                
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              });
            });
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            // 아이템 추가/삭제 시 전체 목록 새로고침
            fetchItems();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchItems]);

  useEffect(() => {
    if (onItemAdded) {
      fetchItems();
    }
  }, [onItemAdded, fetchItems]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const isAdmin = session?.user && (session.user as ExtendedUser).isAdmin;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative items-grid" style={{ zIndex: 0, position: 'relative' }}>
      {items.map((item) => (
        <ItemCard 
          key={item.id} 
          item={item} 
          onBidSuccess={() => updateSingleItem(item.id)} 
          onItemDeleted={fetchItems}
        />
      ))}
      
      {/* 관리자일 때만 아이템 추가 카드 표시 */}
      {isAdmin && (
        <AddItemCard onItemAdded={fetchItems} />
      )}
    </div>
  );
}
