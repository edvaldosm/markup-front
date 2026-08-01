/**
 * Autorização de acesso a empresas — espelho no front da Rule R09
 * (ownership multi-empresa + ADMIN global).
 *
 * Funções **puras**: não dependem de store, router ou rede. O backend continua
 * sendo a autoridade (R02/R09) — aqui só decidimos o que a UI oferece, para o
 * usuário nunca navegar até algo que o servidor vai negar.
 */
import type { AuthUser, Empresa, PermissaoChave } from '@/types'

/** O perfil da sessão tem visão global (ADMIN)? */
export function isAdminGlobal(user: AuthUser | null): boolean {
  return user?.perfil.escopoGlobal === true
}

/** O usuário é o dono desta empresa (quem a cadastrou)? */
export function isDono(user: AuthUser | null, empresa: Empresa): boolean {
  return !!user && empresa.donoUsuarioId === user.id
}

/** A empresa foi explicitamente compartilhada com o usuário (USUARIO_EMPRESA)? */
export function isCompartilhada(user: AuthUser | null, empresa: Empresa): boolean {
  return !!user?.vinculos.some(v => v.empresaId === empresa.id)
}

/**
 * Conjunto de empresas que o usuário pode ver/operar:
 * ADMIN ⇒ todas; caso contrário, as **próprias** ∪ as **compartilhadas**.
 *
 * Equivale à query `minhasEmpresas` do backend.
 */
export function empresasAutorizadas(user: AuthUser | null, todas: Empresa[]): Empresa[] {
  if (!user) return []
  if (isAdminGlobal(user)) return [...todas]
  return todas.filter(emp => isDono(user, emp) || isCompartilhada(user, emp))
}

/**
 * O usuário pode operar nesta empresa? Use antes de aceitar qualquer `empresaId`
 * vindo da UI (rota, seletor, formulário) — nunca confiar no id sem checar.
 */
export function podeAcessarEmpresa(
  user: AuthUser | null,
  empresaId: string,
  todas: Empresa[],
): boolean {
  return empresasAutorizadas(user, todas).some(e => e.id === empresaId)
}

/**
 * Pode entrar no **módulo de Gestão do Site**? Só o escopo global (ADMIN).
 *
 * Deliberadamente **não** é uma `PermissaoChave`: as permissões do RBAC dizem o
 * que se faz *dentro de uma empresa*; aqui o que decide é o escopo — um
 * PROPRIETARIO tem todas as permissões e mesmo assim não administra o site.
 */
export function podeAcessarModuloAdmin(user: AuthUser | null): boolean {
  return isAdminGlobal(user)
}

/** O perfil da sessão possui esta permissão RBAC? */
export function temPermissao(user: AuthUser | null, chave: PermissaoChave): boolean {
  return !!user?.perfil.permissoes.some(p => p.chave === chave)
}
