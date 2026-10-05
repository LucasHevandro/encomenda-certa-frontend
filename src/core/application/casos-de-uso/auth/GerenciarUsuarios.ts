import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import type { Usuario } from "../../portas/SessaoGateway";
import type { NovoUsuario, UsuariosGateway } from "../../portas/UsuariosGateway";

export const SENHA_MINIMA = 8;

export class GerenciarUsuarios {
  constructor(private readonly usuarios: UsuariosGateway) {}

  listar(): Promise<Usuario[]> {
    return this.usuarios.listar();
  }

  criar({ nome, email, senha }: NovoUsuario): Promise<Usuario> {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    if (nomeLimpo === "") throw new ErroDeDominio("usuario-sem-nome", "Informe o nome da pessoa.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) throw new ErroDeDominio("email-invalido", "Informe um e-mail válido.");
    validarSenha(senha);
    return this.usuarios.criar({ nome: nomeLimpo, email: emailLimpo, senha });
  }

  mudarSenha(senhaAtual: string, novaSenha: string, confirmacao: string): Promise<void> {
    if (senhaAtual === "") throw new ErroDeDominio("senha-atual-vazia", "Informe a senha atual.");
    validarSenha(novaSenha);
    if (novaSenha !== confirmacao) throw new ErroDeDominio("senhas-diferentes", "A confirmação não é igual à nova senha.");
    return this.usuarios.mudarSenha(senhaAtual, novaSenha);
  }
}

function validarSenha(senha: string) {
  if (senha.length < SENHA_MINIMA) {
    throw new ErroDeDominio("senha-curta", `A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`);
  }
}
