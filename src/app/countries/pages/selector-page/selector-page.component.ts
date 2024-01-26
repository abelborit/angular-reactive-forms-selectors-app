import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountriesService } from '../../services/countries.service';
import { Region } from '../../interfaces/country.interface';

@Component({
  selector: 'app-selector-page',
  templateUrl: './selector-page.component.html',
  styles: [],
})
export class SelectorPageComponent {
  constructor(
    private formBuilder: FormBuilder,
    private countriesService: CountriesService
  ) {}

  public myForm: FormGroup = this.formBuilder.nonNullable.group({
    region: ['', Validators.required],
    country: ['', Validators.required],
    borders: ['', Validators.required], // fronteras con los cuales cada país limita
  });

  /* con eso se está usando el servicio CountriesService que es privado y sus propiedades como en este caso. Hacerlo de esta forma no afecta por crear nuevos espacios en memoria ya que esto apunta al espacio en memoria que ya tiene this.countriesService.getRegions, es decir, que this.countriesService.getRegions pasa por referencia para poder utilizarlo aquí */
  get getRegions(): Region[] {
    return this.countriesService.getRegions;
  }
}
