import { Injectable } from '@angular/core';
import { Region } from '../interfaces/country.interface';

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private _regions: Region[] = [
    Region.Africa,
    Region.Americas,
    Region.Asia,
    Region.Europe,
    Region.Oceania,
  ];

  /* como _regions es una propiedad privada entonces se hará un getter para acceder desde el exterior a sus propiedad y sus valores y en este getter se hará un deep clone o un spread operator para romper la referencia con el objeto original */
  get getRegions(): Region[] {
    /* se aplicará el operador spread para romper la referencia con el objeto original de _regions y si por alguna razón se cambia algo o se muta del objeto/arreglo este cambio no afecte al objeto original */
    // return [...this._regions];

    /* otra opción más reciente es hacerlo con el structuredClone y este structuredClone() es básicamente la solución que tiene ahora JavaScript para realizar un clon profundo (deep clone) y no importa cuantos objetos y propiedades tenga la propiedad privada a copiar porque el structuredClone() hará un deep clone */
    return structuredClone(this._regions);
  }
}
