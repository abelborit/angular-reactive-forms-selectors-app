import { Injectable } from '@angular/core';
import { Country, Region, SmallCountry } from '../interfaces/country.interface';
import { Observable, combineLatest, map, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

/* FORMA 1: al usar el HttpClient se tiene que importar el HttpClientModule pero darse cuenta que este servicio de CountriesService se puede utilizar a lo largo de toda la aplicación debido al { providedIn: 'root' } y por eso el HttpClientModule se tendría que colcoar en los imports de app.module.ts que es de forma global */
/* FORMA 2: otra forma de hacerlo sería que se quite el { providedIn: 'root' } a este servicio de CountriesService y luego se coloque en los providers del módulo que lo usará que en este caso sería countries.module.ts, después colocar el HttpClientModule en los imports del módulo que lo usará que sería el countries.module.ts y de esa forma hacemos que tanto las peticiones y el servicio solo sean utilizados para este módulo y sus componentes como tal */
@Injectable({ providedIn: 'root' })
export class CountriesService {
  constructor(private httpClient: HttpClient) {}

  private baseURL: string = 'https://restcountries.com/v3.1';

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

  /* aquí el getCountriesByRegion regresará un observable que emite algo de tipo SmallCountry pero en la petición HTTP nos dará algo de tipo Country por eso se hará una refactorización de la data que retorna la petición HTTP */
  getCountriesByRegion(region: Region): Observable<SmallCountry[]> {
    /* si region es un falsy entonces que regrese un observable que emite un arreglo vacío */
    if (!region) return of([]);

    /* para que solo me regresen los cca3, name y borders usando el query de fields */
    const url = `${this.baseURL}/region/${region}?fields=cca3,name,borders`;

    return this.httpClient.get<Country[]>(url).pipe(
      /* el nombre de "response" se puede cambiar a cualquier otro nombre a nuestra preferencia y en este caso colocaremos countries para el operador map del pipe y country en el método iterador de los arreglos que es el map() */
      /* se utiliza primero el operador map de los pipes para transformar la data a lo que nosotros queremos usar y luego el método map() de los arreglos para iterar sobre cada elemento */
      map((countries) =>
        countries.map((country) => ({
          name: country.name.common,
          cca3: country.cca3,
          borders: country.borders ?? [], // se está usando el operador de coalescencia nula que es un operador lógico que retorna el operando de lado derecho cuando el operando de lado izquierdo es null o undefined, y en caso contrario retorna el operando de lado izquierdo. Se podría utilizar el || pero este retorna el operando de lado derecho si el operando izquierdo es cualquier valor falsy, es decir, no solo null o undefined sino por ejemplo un string vacío pero con el ?? ese string vacío se podría conservar ya que no es null o undefined
        }))
      ),
      tap((countries) => console.log({ countries }))
    );
  }

  getCountryByAlphaCode(alphaCode: string): Observable<SmallCountry> {
    const url = `${this.baseURL}/alpha/${alphaCode}?fields=cca3,name,borders`;

    return this.httpClient.get<Country>(url).pipe(
      map((country) => ({
        name: country.name.common,
        cca3: country.cca3,
        borders: country.borders ?? [],
      })),
      tap((country) => console.log({ country }))
    );
  }

  /* aquí se van a obtener los nombres de las fronteras o borders que se pasen, pero nosotros ya tenemos una función la cual es getCountryByAlphaCode que según el alphaCode nos regresa datos sobre ese país y estos borders son un arreglo de esos códigos, entonces por cada código que tenga borders se tendría que disparar la función getCountryByAlphaCode y para esto getCountryBordersByCodes nos regresará un observable que emita un arreglo de SmallCountry */
  getCountryBordersByCodes(borders: string[]): Observable<SmallCountry[]> {
    /* cláusula de seguridad */
    if (!borders || borders.length === 0) return of([]);

    /* este countriesRequests será un arreglo con las respuestas que nos dará cada código de borders al ejecutar la función getCountryByAlphaCode, entonces como la función getCountryByAlphaCode nos regresa un Observable<SmallCountry> este countriesRequests será un Observable<SmallCountry> pero como arreglo, es decir, arreglo de observables que emitan algo de tipo SmallCountry y este no se va a disparar hasta que no se suscriba, entonces no hay problema. Como referencia, este Observable<SmallCountry>[] sería como un Promise[] para luego usar un Promise.all() */
    const countriesRequests: Observable<SmallCountry>[] = [];

    /* ejecutar por cada código que tenga borders */
    borders.forEach((code) => {
      const request = this.getCountryByAlphaCode(code);
      countriesRequests.push(request);
    });

    /* a este combineLatest() que es de RxJS, le tenemos que mandar nuestro conjunto de observables y al final nos suscribiremos que en este caso será cuando se mande a llamar a la función getCountryBordersByCodes.Este combineLatest va a emitir hasta que todos los observables del arreglo que se está mandando emitan un valor. Todos se disparan de manera simultanea */
    return combineLatest(countriesRequests);
  }
}
