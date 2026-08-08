/**
 * Operações de usuários e perfis — fatia 2 da integração.
 *
 * Duas ausências deliberadas do contrato aparecem aqui:
 *
 * - **Não existe criação direta de usuário.** O cadastro é por convite: quem
 *   convida precisa de `USUARIO_WRITE` e de alcance sobre a empresa de destino.
 * - **Não existe mutation de perfil.** `perfil` é dado de sistema, nasce no
 *   Flyway. Como PROPRIETARIO tem `PERFIL_WRITE` e o perfil é global, permitir
 *   escrita promoveria qualquer dono a administrador de toda a base.
 */
import { gql } from '@apollo/client/core'
import { CAMPOS_PERFIL } from './acesso'

export const PERFIS = gql`
  query perfis {
    perfis {
      ...CamposPerfil
    }
  }
  ${CAMPOS_PERFIL}
`

export const USUARIOS = gql`
  query usuarios {
    usuarios {
      id
      nome
      email
      cpf
      dataNascimento
      ativo
      empresas {
        empresaId
        perfil {
          ...CamposPerfil
        }
      }
      perfilGlobal {
        ...CamposPerfil
      }
    }
  }
  ${CAMPOS_PERFIL}
`

/**
 * `senhaProvisoria` é exibida **uma única vez**: não é recuperável depois. A UI
 * precisa dizer isso antes que o usuário feche o modal e perca a credencial de
 * outra pessoa.
 *
 * `cpf`/`dataNascimento` obrigatórios (REQ-01) — o backend estreitou também a
 * autorização: deixa de bastar `USUARIO_WRITE`, passa a exigir ser o dono da
 * empresa ou ter escopo global (REQ-03/04, checado no cliente por
 * `souDonoDaEmpresa` antes mesmo de oferecer o botão).
 */
export const CONVIDAR_USUARIO = gql`
  mutation convidarUsuario(
    $nome: String!
    $email: String!
    $cpf: String!
    $dataNascimento: DateTime!
    $empresaId: ID!
    $perfilId: ID!
  ) {
    convidarUsuario(
      nome: $nome
      email: $email
      cpf: $cpf
      dataNascimento: $dataNascimento
      empresaId: $empresaId
      perfilId: $perfilId
    ) {
      senhaProvisoria
      usuario {
        id
        nome
        email
        cpf
        dataNascimento
        ativo
        empresas {
          empresaId
          perfil {
            ...CamposPerfil
          }
        }
      }
    }
  }
  ${CAMPOS_PERFIL}
`

/**
 * Edição de dados cadastrais (REQ-02/08/09) — nome/CPF/nascimento/e-mail.
 * Não mexe em perfil nem vínculo: isso continua em `definirPerfilNoVinculo`
 * (fluxo já existente, fora de escopo desta feature).
 */
export const ATUALIZAR_USUARIO = gql`
  mutation atualizarUsuario(
    $usuarioId: ID!
    $nome: String!
    $cpf: String!
    $dataNascimento: DateTime!
    $email: String!
  ) {
    atualizarUsuario(
      usuarioId: $usuarioId
      nome: $nome
      cpf: $cpf
      dataNascimento: $dataNascimento
      email: $email
    ) {
      id
      nome
      email
      cpf
      dataNascimento
      ativo
      empresas {
        empresaId
        perfil {
          ...CamposPerfil
        }
      }
      perfilGlobal {
        ...CamposPerfil
      }
    }
  }
  ${CAMPOS_PERFIL}
`
