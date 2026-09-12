import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MailingList {
  id: string;
  name: string;
  emails: string;
  createdAt: string;
}

export function useMailingLists() {
  return useQuery({
    queryKey: ['mailingLists'],
    queryFn: async () => {
      const { data } = await api.get<MailingList[]>('/mailing-lists');
      return data;
    },
  });
}

export function useCreateMailingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; emails: string[] }) => {
      const { data } = await api.post('/mailing-lists', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailingLists'] });
    },
  });
}
