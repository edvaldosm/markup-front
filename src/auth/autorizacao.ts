/**
 * Autorização no front — o que a **UI oferece**.
 *
 * Funções **puras**: não dependem de store, router ou rede. O backend continua
 * sendo a autoridade (R02/R09/B5); aqui só decidimos o que mostrar, para o
 * usuário nunca navegar até algo que o servidor vai negar.
 *
 * **O que já morou aqui e não mora mais:** `empresasAutorizadas`, `isDono`,
 * `isCompartilhada` e `podeAcessarEmpresa` decidiam, no cliente, *quais
 * empresas* o usuário podia ver. Isso agora é resposta de `minhasEmpresas` (B9)
 * — regra de isolamento decidida no navegador é regra que o usuário pode
 * alterar. O front reflete o conjunto que o servidor devolveu; não o calcula.
 */
import type { Empresa, Perfil, PermissaoChave, Usuario } from '@/types'

/**
 * Perfil que vale para a sessão agora.
 *
 * Um usuário pode ter **perfis diferentes em empresas diferentes** — no seed,
 * Ana é `PROPRIETARIO` na empresa 1 e `CONTADOR` na 3. Por isso o perfil não é
 * um atributo do usuário: é função dele **com a empresa ativa**. Escopo global
 * (ADMIN) prevalece, porque não está preso a vínculo nenhum.
 */
export function perfilEfetivo(usuario: Usuario | null, empresaAtivaId: string): Perfil | null {
  if (!usuario) return null
  if (usuario.perfilGlobal) return usuario.perfilGlobal
  return usuario.empresas.find(v => v.empresaId === empresaAtivaId)?.perfil ?? null
}

/** O perfil da sessão tem visão global (ADMIN)? */
export function isAdminGlobal(perfil: Perfil | null): boolean {
  return perfil?.escopoGlobal === true
}

/** O perfil da sessão possui esta permissão RBAC? */
export function temPermissao(perfil: Perfil | null, chave: PermissaoChave): boolean {
  return !!perfil?.permissoes.some(p => p.chave === chave)
}

/**
 * Pode entrar no **módulo de Gestão do Site**? Só o escopo global (ADMIN).
 *
 * Deliberadamente **não** é uma `PermissaoChave`: as permissões do RBAC dizem o
 * que se faz *dentro de uma empresa*; aqui o que decide é o escopo — um
 * PROPRIETARIO tem todas as permissões e mesmo assim não administra o site.
 */
export function podeAcessarModuloAdmin(perfil: Perfil | null): boolean {
  return isAdminGlobal(perfil)
}

/**
 * O usuário logado é o **dono** desta empresa (`Empresa.donoUsuarioId`, R09)?
 *
 * Distinto de `temPermissao(perfil, 'USUARIO_WRITE')`: qualquer PROPRIETARIO
 * vinculado tem a permissão RBAC, mas só quem cadastrou a empresa é o dono —
 * o backend estreitou `convidarUsuario` para exigir isto (ou escopo global),
 * e esta função é a mesma checagem no cliente, só para decidir o que a tela
 * oferece (REQ-03/04). Não lança para `usuario`/`empresa` nulos: devolve
 * `false`, o mesmo resultado seguro de "não é dono".
 */
export function souDonoDaEmpresa(usuario: Usuario | null, empresa: Empresa | null): boolean {
  if (!usuario || !empresa) return false
  return empresa.donoUsuarioId === usuario.id
}
