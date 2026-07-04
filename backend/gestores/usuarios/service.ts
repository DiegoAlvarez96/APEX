import { modulesService } from "@/lib/server/services/modulesService";
import { usuariosRepository } from "./repository";
import { registerUserSchema } from "./validation";
import type { RegisterUserInput } from "./types";

export const usuariosService = {
  async register(input: RegisterUserInput) {
    const data = registerUserSchema.parse(input);
    const user = await usuariosRepository.createUser(data);
    await modulesService.ensureDefaults(user.id);
    return user;
  },

  getProfile(userId: string) {
    return usuariosRepository.findUserById(userId);
  }
};
