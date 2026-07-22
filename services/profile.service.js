/**
 * profile.service.js
 * ============================================================================
 * Regras de negócio relacionadas ao perfil do usuário: validação dos
 * campos, validação de tipo/tamanho da foto antes do upload.
 *
 * Não sabe nada sobre autenticação (login/senha) — isso é responsabilidade
 * de services/auth.service.js. Este arquivo só fala da tabela "profiles"
 * e do Storage de avatares.
 * ============================================================================
 */

import * as profileRepository from '../repositories/profile.repository.js';
import { THEME_OPTIONS } from '../models/profile.model.js';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Busca o profile de um usuário.
 * @param {string} userId
 */
export async function getMyProfile(userId) {
  return profileRepository.findById(userId);
}

/**
 * Atualiza os dados do profile (não inclui a foto — ver updateAvatar).
 * @param {string} userId
 * @param {object} data
 */
export async function updateProfile(userId, data) {
  validate(data);

  return profileRepository.update(userId, {
    full_name: data.full_name?.trim() || null,
    phone: data.phone?.trim() || null,
    currency: data.currency || 'BRL',
    language: data.language || 'pt-BR',
    theme: data.theme || 'system',
  });
}

/**
 * Valida e envia uma nova foto de perfil, depois salva a URL resultante
 * no profile.
 * @param {string} userId
 * @param {File} file
 */
export async function updateAvatar(userId, file) {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error('Formato de imagem não suportado. Use JPG, PNG ou WEBP.');
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('A imagem deve ter no máximo 2MB.');
  }

  const avatarUrl = await profileRepository.uploadAvatar(userId, file);
  return profileRepository.update(userId, { avatar_url: avatarUrl });
}

/** Última linha de defesa antes de enviar dados ao Supabase. */
function validate(data) {
  if (!data.full_name?.trim()) {
    throw new Error('Informe seu nome completo.');
  }
  if (data.theme && !THEME_OPTIONS.includes(data.theme)) {
    throw new Error('Tema inválido.');
  }
  if (data.phone?.trim() && !/^[\d\s()+-]{8,20}$/.test(data.phone.trim())) {
    throw new Error('Telefone em formato inválido.');
  }
}
