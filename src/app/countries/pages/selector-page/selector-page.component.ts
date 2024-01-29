import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountriesService } from '../../services/countries.service';
import { Region, SmallCountry } from '../../interfaces/country.interface';
import { filter, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-selector-page',
  templateUrl: './selector-page.component.html',
  styles: [],
})
export class SelectorPageComponent implements OnInit {
  constructor(
    private formBuilder: FormBuilder,
    private countriesService: CountriesService
  ) {}

  /* como se está trabajando con select anidados entonces cuando se tenga el valor del primer select recién tendría que aparecer el segundo select para poder seleccionar su valor y así sucesivamente, para eso tenemos que ver cómo estar escuchando o detectando cuando el select cambie ya que todo empieza cuando pasa de un string vacio a tener un valor, entonces agregaremos un listener que va a estar escuchando cuando la propiedad region de myForm cambie para lanzar una petición HTTP con el valor de region seleccionada y poder traer países basado en la región y si es un string vacío entonces no necesito lanzar una petición HTTP */
  /* para hacer el listener mencionado hay varias formas pero una de ellas según el propio Angular es usar el OnInit y ngOnInit y este ngOnInit se a va disparar en el punto en el tiempo cuando se está inicializando este componente y para eso ya tendremos los servicios inyectados y las propiedades para poder utilizarlas */
  ngOnInit(): void {
    /* tomar la propiedad region de myForm y estar pendiende si sus valores cambian, luego nos suscribimos, porque valueChanges es un observable, y con eso vamos a obtener su valor. NOTA: al hacerlo de esta forma al usar el ngOnInit y nos estamos subscribiendo es conveniente que cuando destruyamos el componente también limpiemos estas subscripciones que estamos haciendo aquí ya que si no se hace eso y aunque no exista el componente siempre van a estar por ahí las subscripciones entonces por eso hay que borrarlas */
    /* lo que se aconseja es que en el ngOnInit haya código simple y sencillo entonces el código de abajo estaría bien colocarlo pero como habrá más código entonces lo pasaremos a una función aparte por eso es que se está comentando */
    // this.myForm
    //   .get('region')
    //   ?.valueChanges.subscribe((response) => console.log({ response }));

    /* se mandará la función/método por aquí para hacerlo más simple */
    this.handleRegionChanged();
    this.handleCountryChanged();
  }

  public myForm: FormGroup = this.formBuilder.nonNullable.group({
    region: ['', Validators.required],
    country: ['', Validators.required],
    borders: ['', Validators.required], // fronteras con los cuales cada país limita
  });

  public countriesByRegion: SmallCountry[] = [];
  public borders: SmallCountry[] = [];

  /* con eso se está usando el servicio CountriesService que es privado y sus propiedades como en este caso. Hacerlo de esta forma no afecta por crear nuevos espacios en memoria ya que esto apunta al espacio en memoria que ya tiene this.countriesService.getRegions, es decir, que this.countriesService.getRegions pasa por referencia para poder utilizarlo aquí */
  get getRegions(): Region[] {
    return this.countriesService.getRegions;
  }

  /* el pipe switchMap() me permite recibir el valor de un observable (entonces sería el valor anterior que sería en este caso el response que me da el valueChanges que en este caso lo llamaremos como region para tener un nombre acorde a la respuesta que tenemos) para luego subscribirme a otro observable */
  /* otra forma de colocar funciones sería que si hay un argumento o varios argumentos y esos argumentos se mandan como argumentos a otra función, es decir, tengo el argumento response y se envía ese mismo response a getCountriesByRegion entonces se podría mandar la función por referencia de esta forma switchMap(this.countriesService.getCountriesByRegion) ya que los argumentos estarían de forma implícita */
  handleRegionChanged(): void {
    this.myForm
      .get('region')
      ?.valueChanges.pipe(
        /* cuando cambia la región entonces el primer paso es que la propiedad de country de myForm sea un string vacío para que pueda tomar la opción de <option value="">-- Seleccine País --</option>. Aquí sería una función normal porque no usaremos el response entonces también se podría eliminar del argumento */
        tap(() => this.myForm.get('country')?.setValue('')),
        tap(() => (this.borders = [])),
        switchMap((region) => {
          console.log({ region });
          return this.countriesService.getCountriesByRegion(region);
        })
      )
      .subscribe((countries) => {
        /* aquí me da la respuesta final ya con los países */
        console.log({ countries });
        this.countriesByRegion = countries.sort((country1, country2) =>
          country1.name.localeCompare(country2.name)
        );
      });
  }

  handleCountryChanged(): void {
    this.myForm
      .get('country')
      ?.valueChanges.pipe(
        tap(() => this.myForm.get('borders')?.setValue('')),
        /* se coloca este filter ya que por ejemplo en getCountriesByRegion se colocó un condicional if() para evaluar si se envía algún valor y evitar un error en la solicitud pero también en este caso se puede hacer de esta forma con un filter para que si retorna un true entonces siga con la ejecución de los siguientes operadores RxJS pero si retorna un false entonces ya no continúa y no realiza ninguna emisión a la cual suscribirse */
        filter((value: string) => value.length > 0),
        /* aquí se coloca como alphaCode ya que en los value de las options se colocó el cca3 que sería este código */
        switchMap((alphaCode) => {
          console.log({ alphaCode });
          return this.countriesService.getCountryByAlphaCode(alphaCode);
        }),
        /* aquí se coloca como country ya que el switchMap anterior nos está dando un Observable<SmallCountry> que sería el país y de ahí sacamos los borders */
        switchMap((country) =>
          this.countriesService.getCountryBordersByCodes(country.borders)
        )
      )
      .subscribe((countries) => {
        console.log({ countries });
        this.borders = countries;
      });
  }
}

/* ******************************************************************************************************************* */
/*
En Angular, cuando estás trabajando con observables y pipes, el orden de las operaciones en la cadena de observables es significativo. El método subscribe es el que activa la ejecución de la cadena de observables. Si colocas el subscribe antes de aplicar operadores como pipe, el código puede no funcionar como esperas.

Aquí se está utilizando el método valueChanges para obtener un observable que emite eventos cada vez que cambia el valor de un control en tu formulario. Luego, se está aplicando el operador switchMap usando el método pipe. El switchMap permite cambiar de un observable a otro, en este caso, cuando cambia el valor del control, cambias al observable que proviene de getCountriesByRegion.

Si se coloca el subscribe antes del pipe, no se estaría aplicando el operador switchMap al observable obtenido de valueChanges. En cambio, nos estaríamos suscribiéndo directamente al observable valueChanges sin aplicar ninguna transformación. Esto significa que no se estaría manejando el cambio de región como se pretende con el switchMap.

Entonces, el orden correcto sería primero aplicar los operadores de transformación (como pipe con switchMap) y luego suscribirte al observable resultante utilizando el método subscribe.
*/

/* ******************************************************************************************************************* */
/* Si deseo mostrar al usuario una alerta de, por ejemplo, que algo salió mal al cargar una lista, ¿Desde dónde tengo que mandar la alerta; desde el componente que realizó la petición ó desde el servicio? */
/* Sería más adecuado lanzar la alerta desde el componente que realizó la petición. De esta manera, se puede mantener el servicio centrado únicamente en la solicitud de los datos. Por ejemplo, si se está utilizando Sweet Alert, se podría lanzar la alerta directamente desde el componente. Esto permitiría tener una separación más clara de las responsabilidades y facilitaría la gestión de los errores. */

/* ******************************************************************************************************************* */
/* Los listener de los eventos se hicieron en el OnInit, ¿Es esa el mejor ciclo de vida para usarlo? ¿Se podría usar AfterViewInit ya que en teoria es cuando ya se contruyó el HTML? */
/* Sí, en este caso nos interesa situarlo dentro del OnInit porque si bien es cierto que el AfterViewInit nos serviría para esperar a que la view estuviera completamente cargada, el AfterViewInit se ejecuta cada vez que esta vista vuelva a ser cargada, es decir, cuando nos movamos entre componentes, el código de este ciclo de vida se dispararía.

El OnInit únicamente se ejecuta la primera vez que carga el componente, y no se volverá a ejecutar hasta que se destruya ese componente que ya existe. Es por eso que nos interesa mantener los listeners en el OnInit, ya que cuando se dispara este ciclo de vida podemos crear ahí los listeners, y nos aseguramos que únicamente es ejecutado el código una vez. */

/* ******************************************************************************************************************* */
/*  Con respecto a los suscribers de los campos del formulario, ¿Co se debería desuscribir de los observables al momento que el componente se destruya? */
/*
Sí sería una práctica recomendable.

Se podría revisar:
  - https://stackoverflow.com/questions/38008334/angular-rxjs-when-should-i-unsubscribe-from-subscription
  - https://stackoverflow.com/questions/41364078/angular-2-does-subscribing-to-formcontrols-valuechanges-need-an-unsubscribe

En nuestro caso, almacenaríamos el resultado del this.myForm.get('region')!.valueChanges...subscribe() en una variable, para luego en un OnDestroy, poder hacer los unsubscribes del mismo, por ejemplo (también puedes revisar otras implementaciones como la que comentan en los enlaces adjuntos).
*/

/* ******************************************************************************************************************* */
/* Cuando queriamos detectar los cambios en las regiones y paises, hemos puesto esos métodos en el ngOnInit pero ¿Sería también correcto ponerlo en el ngOnChanges? */
/*
Se utiliza el método ngOnInit para llamar a las funciones handleRegionChanged() y handleCountryChanged(), que suscriben observables a cambios en los valores de los campos del formulario. Esto se realiza cuando el componente se inicializa.

En cuanto a la pregunta sobre si sería correcto poner esos métodos en el ngOnChanges, la respuesta es que no sería adecuado. El ngOnChanges es un hook del ciclo de vida de Angular que se ejecuta cada vez que una propiedad de entrada del componente cambia su valor. No está diseñado para suscribirse a eventos de formularios o realizar acciones relacionadas con cambios en la interfaz de usuario.

En este caso, los métodos handleRegionChanged() y handleCountryChanged() están suscribiendo observables para detectar cambios en los campos del formulario, y esto es una acción que normalmente se realiza en el ngOnInit, cuando el componente se inicia por primera vez.

El ngOnInit es la opción adecuada y recomendada, de esta manera, nos aseguramos de que las suscripciones se realicen solo una vez al inicializar el componente y evitar posibles problemas de rendimiento y comportamiento no deseado al utilizar el ngOnChanges.
*/
