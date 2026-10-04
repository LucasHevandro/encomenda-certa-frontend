import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import type { SessaoGateway, Usuario } from "../../portas/SessaoGateway";

export class Sessao {
  constructor(private readonly sessao: SessaoGateway) {}

  entrar(email: string, senha: string): Promise<Usuario> {
    const limpo = email.trim().toLowerCase();
    if (limpo === "" || senha === "") {
      throw new ErroDeDominio("login-incompleto", "Informe e-mail e senha.");
    }
    return this.sessao.entrar(limpo, senha);
  }

  sair(): Promise<void> {
    return this.sessao.sair();
  }

  atual(): Promise<Usuario | null> {
    return this.sessao.atual();
  }
}
