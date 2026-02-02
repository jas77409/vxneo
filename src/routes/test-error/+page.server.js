import { error } from '@sveltejs/kit';
export const load = async () => {
  throw error(401, 'Test Unauthorized Error');
};
