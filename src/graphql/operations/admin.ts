/**
 * Gestão do Site — operações de escopo global (B9/F10). Só quem tem
 * `escopoGlobal` no perfil recebe resposta; os demais levam `FORBIDDEN`.
 */
import { gql } from '@apollo/client/core'
import { CAMPOS_PERFIL, CAMPOS_EMPRESA } from './acesso'

const CAMPOS_VINCULO = gql`
  fragment CamposVinculo on UsuarioEmpresa {
    empresaId
    perfil {
      ...CamposPerfil
    }
  }
  ${CAMPOS_PERFIL}
`

const CAMPOS_USUARIO_ADMIN = gql`
  fragment CamposUsuarioAdmin on Usuario {
    id
    nome
    email
    cpf
    dataNascimento
    ativo
    empresas {
      ...CamposVinculo
    }
    perfilGlobal {
      ...CamposPerfil
    }
  }
  ${CAMPOS_VINCULO}
  ${CAMPOS_PERFIL}
`

const CAMPOS_MEMBRO_EQUIPE = gql`
  fragment CamposMembroEquipe on MembroEquipe {
    usuario {
      ...CamposUsuarioAdmin
    }
    perfil {
      ...CamposPerfil
    }
    dono
  }
  ${CAMPOS_USUARIO_ADMIN}
  ${CAMPOS_PERFIL}
`

const CAMPOS_EMPRESA_ADMIN = gql`
  fragment CamposEmpresaAdmin on EmpresaAdmin {
    empresa {
      ...CamposEmpresa
    }
    dono {
      ...CamposUsuarioAdmin
    }
    totalUsuarios
    equipe {
      ...CamposMembroEquipe
    }
  }
  ${CAMPOS_EMPRESA}
  ${CAMPOS_USUARIO_ADMIN}
  ${CAMPOS_MEMBRO_EQUIPE}
`

export const TODAS_EMPRESAS = gql`
  query todasEmpresas {
    todasEmpresas {
      ...CamposEmpresaAdmin
    }
  }
  ${CAMPOS_EMPRESA_ADMIN}
`

export const EMPRESA_ADMIN = gql`
  query empresaAdmin($empresaId: ID!) {
    empresaAdmin(empresaId: $empresaId) {
      ...CamposEmpresaAdmin
    }
  }
  ${CAMPOS_EMPRESA_ADMIN}
`

export const TODOS_USUARIOS = gql`
  query todosUsuarios {
    todosUsuarios {
      ...CamposUsuarioAdmin
    }
  }
  ${CAMPOS_USUARIO_ADMIN}
`

export const METRICAS_DA_BASE = gql`
  query metricasDaBase {
    metricasDaBase {
      totalEmpresas
      totalUsuarios
      usuariosAtivos
      totalVinculos
      faturamentoTotal
    }
  }
`

export const VINCULAR_USUARIO = gql`
  mutation vincularUsuario($usuarioId: ID!, $empresaId: ID!, $perfilId: ID!) {
    vincularUsuario(usuarioId: $usuarioId, empresaId: $empresaId, perfilId: $perfilId) {
      ...CamposVinculo
    }
  }
  ${CAMPOS_VINCULO}
`

export const DESVINCULAR_USUARIO = gql`
  mutation desvincularUsuario($usuarioId: ID!, $empresaId: ID!) {
    desvincularUsuario(usuarioId: $usuarioId, empresaId: $empresaId)
  }
`

export const DEFINIR_PERFIL_NO_VINCULO = gql`
  mutation definirPerfilNoVinculo($usuarioId: ID!, $empresaId: ID!, $perfilId: ID!) {
    definirPerfilNoVinculo(usuarioId: $usuarioId, empresaId: $empresaId, perfilId: $perfilId) {
      ...CamposVinculo
    }
  }
  ${CAMPOS_VINCULO}
`

export const DEFINIR_USUARIO_ATIVO = gql`
  mutation definirUsuarioAtivo($usuarioId: ID!, $ativo: Boolean!) {
    definirUsuarioAtivo(usuarioId: $usuarioId, ativo: $ativo) {
      id
      ativo
    }
  }
`

/**
 * Convite sem empresa — só quem já é ADMIN global convida outro
 * (`ESCOPO_GLOBAL`, checado no servidor). `senhaProvisoria` é exibida uma
 * única vez, mesma regra de `convidarUsuario` (`usuarios.ts`). `cpf`/
 * `dataNascimento` obrigatórios, mesma exigência do convite por-empresa (REQ-07).
 */
export const CONVIDAR_USUARIO_GLOBAL = gql`
  mutation convidarUsuarioGlobal(
    $nome: String!
    $email: String!
    $cpf: String!
    $dataNascimento: DateTime!
    $perfilId: ID!
  ) {
    convidarUsuarioGlobal(
      nome: $nome
      email: $email
      cpf: $cpf
      dataNascimento: $dataNascimento
      perfilId: $perfilId
    ) {
      senhaProvisoria
      usuario {
        ...CamposUsuarioAdmin
      }
    }
  }
  ${CAMPOS_USUARIO_ADMIN}
`
