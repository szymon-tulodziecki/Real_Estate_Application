import api from "../utils/api";

interface UserLockInfo {
  userId: string;
  since: number;
  ttl?: number;
  ownerInfo?: {
    name: string;
    email: string;
  };
}

interface UserLockResponse {
  locked: boolean;
  lockedBy?: string; // Czytelna nazwa
  lockedById?: string; // ID do porównań
  lockInfo?: UserLockInfo;
}

export const userLockAPI = {
  getLock: async (id: string): Promise<UserLockResponse> => {
    const res = await api.get(`/users/${id}/lock`);
    return res.data;
  },
  acquireLock: async (id: string): Promise<UserLockResponse> => {
    try {
      const res = await api.post(`/users/${id}/lock`);
      // Backend zwraca { message: 'Lock acquired', lock: { acquired: true, owner: userId, since: timestamp }}
      return {
        locked: false, // Lock został pomyślnie przejęty przez nas
        lockedBy: undefined,
        lockedById: undefined,
        lockInfo: res.data.lock
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number; data?: { lock?: UserLockInfo } } };
        if (apiError.response?.status === 423) {
          // Ktoś inny ma lock
          const lockData = apiError.response.data?.lock;
          return {
            locked: true,
            lockedBy: lockData?.ownerInfo?.name || `Użytkownik ${lockData?.userId}`,
            lockedById: lockData?.userId,
            lockInfo: lockData
          };
        }
      }
      throw error;
    }
  },
  releaseLock: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}/lock`);
  },
};
