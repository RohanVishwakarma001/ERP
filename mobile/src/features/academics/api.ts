import { httpClient } from '@/lib/api/http-client';
import type { AssignmentItem, GradeCard } from '@/types';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export const academicsApi = {
  gradeCard: async (): Promise<GradeCard> => (await httpClient.get('/exams/grade-card')).data,

  assignments: async (): Promise<AssignmentItem[]> => (await httpClient.get('/assignments')).data,

  /** Uploads a picked file to cloud storage, then submits its URL against the assignment. */
  async submitAssignment(assignmentId: string, file: PickedFile): Promise<void> {
    const form = new FormData();
    // React Native's FormData accepts this { uri, name, type } shape for file parts.
    form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
    const upload = await httpClient.post<{ url: string }>('/uploads?folder=assignments', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await httpClient.post(`/assignments/${assignmentId}/submit`, { fileUrl: upload.data.url });
  },
};
