import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountriesService } from '../../services/countries.service';
import { Region, SmallCountry } from '../../interfaces/country.interface';
import { switchMap } from 'rxjs';

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
  }

  public myForm: FormGroup = this.formBuilder.nonNullable.group({
    region: ['', Validators.required],
    country: ['', Validators.required],
    borders: ['', Validators.required], // fronteras con los cuales cada país limita
  });

  public countriesByRegion: SmallCountry[] = [];

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
}

/* ******************************************************************************************************************* */
/*
En Angular, cuando estás trabajando con observables y pipes, el orden de las operaciones en la cadena de observables es significativo. El método subscribe es el que activa la ejecución de la cadena de observables. Si colocas el subscribe antes de aplicar operadores como pipe, el código puede no funcionar como esperas.

Aquí se está utilizando el método valueChanges para obtener un observable que emite eventos cada vez que cambia el valor de un control en tu formulario. Luego, se está aplicando el operador switchMap usando el método pipe. El switchMap permite cambiar de un observable a otro, en este caso, cuando cambia el valor del control, cambias al observable que proviene de getCountriesByRegion.

Si se coloca el subscribe antes del pipe, no se estaría aplicando el operador switchMap al observable obtenido de valueChanges. En cambio, nos estaríamos suscribiéndo directamente al observable valueChanges sin aplicar ninguna transformación. Esto significa que no se estaría manejando el cambio de región como se pretende con el switchMap.

Entonces, el orden correcto sería primero aplicar los operadores de transformación (como pipe con switchMap) y luego suscribirte al observable resultante utilizando el método subscribe.
*/
