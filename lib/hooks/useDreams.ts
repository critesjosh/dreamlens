'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  createDream,
  getDream,
  updateDream,
  deleteDream,
  getAllDreams,
  type LocalDream,
} from '@/lib/db/local';
import type { Tag } from '@/types';

export function useDreams() {
  const dreams = useLiveQuery(() => getAllDreams(), []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (dreams !== undefined) {
      setIsLoading(false);
    }
  }, [dreams]);

  const addDream = useCallback(async (data: {
    title?: string;
    content: string;
    recordedAt: Date;
    tags: Tag[];
  }) => {
    return createDream(data);
  }, []);

  const removeDream = useCallback(async (localId: string) => {
    await deleteDream(localId);
  }, []);

  const editDream = useCallback(async (localId: string, updates: Partial<LocalDream>) => {
    await updateDream(localId, updates);
  }, []);

  return {
    dreams: dreams ?? [],
    isLoading,
    addDream,
    removeDream,
    editDream,
  };
}

export function useDream(localId: string | undefined) {
  const dream = useLiveQuery(
    () => (localId ? getDream(localId) : undefined),
    [localId]
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (dream !== undefined || !localId) {
      setIsLoading(false);
    }
  }, [dream, localId]);

  const update = useCallback(async (updates: Partial<LocalDream>) => {
    if (localId) {
      await updateDream(localId, updates);
    }
  }, [localId]);

  const remove = useCallback(async () => {
    if (localId) {
      await deleteDream(localId);
    }
  }, [localId]);

  return {
    dream,
    isLoading,
    update,
    remove,
  };
}
