/**
 * profile.repository.js
 * ============================================================================
 * Camada de acesso a dados — consultas cruas à tabela "profiles" e ao
 * bucket "avatars" do Supabase Storage. Não contém regras de negócio
 * (isso pertence a services/profile.service.js).
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

/**
 * Busca o profile pelo id (igual ao id do usuário em auth.users).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function findById(id) {
  return handleResponse(
    await supabase.from('profiles').select('*').eq('id', id).single()
  );
}

/**
 * Atualiza o profile de um usuário.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>} o profile atualizado
 */
export async function update(id, data) {
  return handleResponse(
    await supabase.from('profiles').update(data).eq('id', id).select('*').single()
  );
}

/**
 * Envia uma foto de perfil para o bucket "avatars", sobrescrevendo a
 * anterior (nome de arquivo fixo por usuário: "{id}/avatar") — trocar a
 * foto nunca acumula arquivos antigos no Storage.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<string>} a URL pública da imagem
 */
export async function uploadAvatar(userId, file) {
  const filePath = `${userId}/avatar`;

  await handleResponse(
    await supabase.storage.from('avatars').upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })
  );

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}
