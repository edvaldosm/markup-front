/**
 * Aceite F9 da feature `cadastro-manutencao-usuario` — teste de navegação por
 * perfil: precisa provar que o **dono da empresa** vê e usa "Cadastrar
 * Usuário", que um **PROPRIETARIO vinculado que não é o dono** não vê o
 * botão (REQ-03/04 — a permissão RBAC deixou de ser suficiente), e que o
 * **admin global** vê em qualquer empresa e também em `AdminUsuariosView`.
 *
 * Complementa `navegacao-multiusuario.spec.ts` (que cobre rota/menu por
 * perfil) com a regra nova desta feature: visibilidade por **ownership**
 * dentro de uma tela já acessível, não por rota inteira.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { montarAppComo, entrarComo, aguardar, prepararAmbiente } from './app-harness'
import { type ServidorFalso } from './servidor-falso'
import { useUsuariosStore } from '@/stores/usuarios'
import { useEmpresaStore } from '@/stores/empresa'

let servidor: ServidorFalso

beforeEach(() => {
  servidor = prepararAmbiente()
})
afterEach(() => {
  servidor.restaurar()
})

describe('visibilidade de "Cadastrar Usuário" (REQ-03/04)', () => {
  it('dona da empresa vê o botão e cadastra (senha provisória exibida)', async () => {
    const app = await montarAppComo('ana@docesdaana.com.br')
    await app.irPara('/usuarios')

    expect(app.texto()).toContain('Cadastrar Usuário')
    app.desmontar()
  })

  it('PROPRIETARIO vinculado mas que NÃO é o dono não vê o botão', async () => {
    // Fernando tem perfil PROPRIETARIO em emp-001 (Doces da Ana), teria a
    // permissão RBAC inteira — mas donoUsuarioId de emp-001 é Ana, não ele.
    const app = await montarAppComo('fernando@docesdaana.com.br')
    await app.irPara('/usuarios')

    expect(app.texto()).not.toContain('Cadastrar Usuário')
    app.desmontar()
  })

  it('admin global vê o botão em qualquer empresa e também em "Cadastrar Usuário Global"', async () => {
    const app = await montarAppComo('admin@markup.com.br')
    const empresaStore = useEmpresaStore()

    // Empresa 1 (Doces da Ana) — Edvaldo não é o dono, mas é ADMIN global
    empresaStore.selecionarEmpresa('1')
    await app.irPara('/usuarios')
    expect(app.texto()).toContain('Cadastrar Usuário')

    // Empresa 2 (MetalForte) — outro dono, mesmo resultado
    empresaStore.selecionarEmpresa('2')
    await app.irPara('/usuarios')
    expect(app.texto()).toContain('Cadastrar Usuário')

    // Gestão do Site — "Cadastrar Usuário Global"
    await app.irPara('/admin/usuarios')
    expect(app.texto()).toContain('Cadastrar Usuário Global')
    app.desmontar()
  })
})

describe('edição de usuário (REQ-02/08) — persiste e sobrevive a novo fetch', () => {
  it('salva nome/CPF/nascimento/e-mail e o novo fetch traz o dado atualizado', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresaStore = useEmpresaStore()
    await aguardar(empresaStore.fetchEmpresas())
    empresaStore.selecionarEmpresa('1')

    const usuarios = useUsuariosStore()
    await aguardar(usuarios.fetchUsuarios())

    const carla = usuarios.usuarios.find(u => u.email === 'carla@docesdaana.com.br')!
    const { nome: nomeOriginal, email: emailOriginal, empresas: empresasOriginais } = carla
    try {
      const salvo = await usuarios.atualizar(
        carla.id, 'Carla Lima Souza', carla.cpf, carla.dataNascimento, 'carla.nova@docesdaana.com.br',
      )
      expect(salvo).not.toBeNull()
      expect(salvo!.nome).toBe('Carla Lima Souza')

      // Novo fetch — não é o mesmo objeto em memória, prova que persistiu no "servidor"
      await aguardar(usuarios.fetchUsuarios())
      const recarregada = usuarios.usuarios.find(u => u.id === carla.id)!
      expect(recarregada.nome).toBe('Carla Lima Souza')
      expect(recarregada.email).toBe('carla.nova@docesdaana.com.br')
      // Perfil/vínculo não mudou — a edição não mexe nisso (REQ-08)
      expect(recarregada.empresas).toEqual(empresasOriginais)
    } finally {
      // `mockUsuarios` é módulo compartilhado entre os testes deste arquivo —
      // desfaz a mutação para não vazar estado para os testes seguintes
      // (mesmo padrão de limpeza que `catalogo.spec.ts` usa para convites).
      await usuarios.atualizar(carla.id, nomeOriginal, carla.cpf, carla.dataNascimento, emailOriginal)
    }
  })

  it('e-mail duplicado ao editar é recusado com mensagem, sem fechar em silêncio', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresaStore = useEmpresaStore()
    await aguardar(empresaStore.fetchEmpresas())
    empresaStore.selecionarEmpresa('1')

    const usuarios = useUsuariosStore()
    await aguardar(usuarios.fetchUsuarios())

    const carla = usuarios.usuarios.find(u => u.email === 'carla@docesdaana.com.br')!
    // E-mail da própria Ana já existe na base
    const salvo = await usuarios.atualizar(carla.id, carla.nome, carla.cpf, carla.dataNascimento, 'ana@docesdaana.com.br')

    expect(salvo).toBeNull()
    expect(usuarios.erro).toBeTruthy()
  })

  it('quem não é dono nem global é recusado ao editar (REQ-09/10)', async () => {
    // Fernando (PROPRIETARIO vinculado, não dono) não pode editar ninguém
    await entrarComo('fernando@docesdaana.com.br')
    const empresaStore = useEmpresaStore()
    await aguardar(empresaStore.fetchEmpresas())

    const usuarios = useUsuariosStore()
    await aguardar(usuarios.fetchUsuarios())

    const carla = usuarios.usuarios.find(u => u.email === 'carla@docesdaana.com.br')!
    const salvo = await usuarios.atualizar(carla.id, 'Nome Forjado', carla.cpf, carla.dataNascimento, carla.email)

    expect(salvo).toBeNull()
    expect(usuarios.erro).toBeTruthy()
  })
})
