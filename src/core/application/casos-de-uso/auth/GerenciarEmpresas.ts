import { ErroDeDominio } from "../../../domain/compartilhado/ErroDeDominio";
import type { Empresa, EmpresasGateway, NovaEmpresa } from "../../portas/EmpresasGateway";
import type { Usuario } from "../../portas/SessaoGateway";
import { prepararNovoUsuario } from "./GerenciarUsuarios";

/** Painel do administrador: cria empresas com o primeiro acesso e liga ou desliga cada uma. */
export class GerenciarEmpresas {
  constructor(private readonly empresas: EmpresasGateway) {}

  listar(): Promise<Empresa[]> {
    return this.empresas.listar();
  }

  criar({ nome, usuario }: NovaEmpresa): Promise<{ empresa: Empresa; usuario: Usuario }> {
    const nomeLimpo = nome.trim();
    if (nomeLimpo === "" || nomeLimpo.length > 60) throw new ErroDeDominio("empresa-sem-nome", "Informe o nome do estabelecimento (até 60 letras).");
    return this.empresas.criar({ nome: nomeLimpo, usuario: prepararNovoUsuario(usuario) });
  }

  mudarAtiva(id: string, ativa: boolean): Promise<Empresa> {
    return this.empresas.mudarAtiva(id, ativa);
  }
}
