import {AuthenticationBindings, AuthenticationMetadata, AuthenticationStrategy} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {ConfiguracionSeguridad} from '../config/configuracion.seguridad';
const fetch = require('node-fetch');
//import {repository} from '@loopback/repository';
//import {Request} from '@loopback/rest/dist/types';
/*import {RolMenuRepository} from '../repositories';
import {SeguridadUsuarioService} from '../services';*/

export class AuthStrategy implements AuthenticationStrategy {
  name = 'auth';

  constructor(
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata[],
  ) {

  }

  /**
   * Autenticacion de un usuario frente a una accion en la base de datos
   * @param request la solicitud con el token
   * @returns  el perfil de usuario, undefined cuando el no tiene permiso o un httpError
   */

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token = parseBearerToken(request);
    if(token){
      const idMenu: string = this.metadata[0].options![0];
      const accion: string = this.metadata[0].options![1];
      console.log(this.metadata);
      //Conectar con el ms de seguridad

      const datos = { token:token, idMenu: idMenu, accion: accion };
      const urlValidarPermisos = `${ConfiguracionSeguridad.enlaceMicroservicioSeguridad}/validar-permisos`;
      let res = undefined;
      try{

        await fetch(urlValidarPermisos, {
          method: 'post',
          body:    JSON.stringify(datos),
          headers: { 'Content-Type' : 'application/json' },
        }).then((res: any) => res.json())
          .then((json: any) => {
            res = json;
          });

        if(res){
          const perfil: UserProfile = Object.assign({
            permitido: "OK"
          });
          return perfil;
        }else {
          return undefined;
        }
      }catch(e){
        throw new HttpErrors[401]("No se tiene permiso sobre la accion a ejecutar.");
      }
    }
    throw new HttpErrors[401]("No es posible ejecutar la accion por falta de token");
  }
}
