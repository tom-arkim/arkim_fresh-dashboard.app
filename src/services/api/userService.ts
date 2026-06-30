import UserBase from '../../types/user/UserBase';
import UserDetails from '../../types/user/UserDetails';
import { apiClientCore as apiClient } from './apiClient';

const userService = {
  setTheme: async (theme: string): Promise<void> => {
    await apiClient.patch(
      '/users/preferences/theme?theme=' + theme,
      {}
    );
  },

  setLanguage: async (language: string): Promise<void> => {
    await apiClient.patch(
      '/users/preferences/language?language=' + language,
      {}
    );
  },

  setDefaultLocation: async (siteId: string): Promise<void> => {
    await apiClient.patch(
      '/users/preferences/site?siteId=' + siteId,
      {}
    );
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string
  ): Promise<void> => {
    await apiClient.patch(
      '/users/preferences/password',
      { oldPassword, newPassword }
    );
  },

  list: async (search: string, showInactive: boolean): Promise<UserBase[]> => {
    const response = await apiClient.get<UserDetails[]>(
      `/users/list?search=${search}&showInactive=${showInactive}`
    );
    return response.data;
  },

  getByName: async (userName: string): Promise<UserDetails> => {
    const response = await apiClient.get<UserDetails>(
      `/users?userName=${encodeURIComponent(userName)}`
    );
    return response.data;
  },

  create: async (user: UserDetails): Promise<void> => {
    await apiClient.post('/users', user);
  },

  update: async (user: UserDetails): Promise<void> => {
    await apiClient.patch(`/users`, user);
  },

  setActiveStatus: async (
    userName: string,
    isActive: boolean
  ): Promise<void> => {
    await apiClient.patch(
      `/users/set/active?userName=${userName}&active=${isActive}`,
      {}
    );
  },

  resetPassword: async (body: { email: string }): Promise<void> => {
    await apiClient.post(`/users/reset-password`, body);
  },

  setPassword: async (body: { email: string, password: string }): Promise<void> => {
    await apiClient.post(`/users/set-password`, body);
  },

  deleteUser: async(username:string):Promise<void> => {
    await apiClient.delete(`/users?userName=${username}`);
  }
};

export default userService;
