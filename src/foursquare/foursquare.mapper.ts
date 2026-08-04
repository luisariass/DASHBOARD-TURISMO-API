import { Document } from 'mongodb';
import {
  toNumberOrNull,
  toStringId,
  toStringOrNull,
} from '../shared/mongo.util';
import { HeatmapPointDto } from '../shared/dto/response.dto';
import {
  ExpandedTipDto,
  ReviewerDto,
  SiteFoursquareDto,
  TipDetailsDto,
} from './dto/foursquare-response.dto';

/**
 * Los mappers hacen explícito el filtrado que en FastAPI hacía el response_model
 * de forma implícita: solo salen los campos declarados, y los ausentes salen
 * como null en vez de omitirse.
 */

export function toSiteFoursquare(doc: Document): SiteFoursquareDto {
  return {
    _id: toStringId(doc._id),
    nombre: toStringOrNull(doc.nombre),
    municipio: toStringOrNull(doc.municipio),
    departamento: toStringOrNull(doc.departamento),
    categoria: toStringOrNull(doc.categoria),
    latitude: toNumberOrNull(doc.latitude),
    longitude: toNumberOrNull(doc.longitude),
    rating: toNumberOrNull(doc.rating),
  };
}

export function toReviewer(doc: Document): ReviewerDto {
  return {
    _id: toStringId(doc._id),
    user_id: toStringOrNull(doc.user_id),
    user_name: toStringOrNull(doc.user_name),
    municipio: toStringOrNull(doc.municipio),
    departamento: toStringOrNull(doc.departamento),
  };
}

function toTipDetails(tip: Document): TipDetailsDto {
  return {
    // tip_id es obligatorio en el modelo de Pydantic; si faltara, allí la
    // respuesta fallaba con un error de validación. Aquí se emite vacío para no
    // tumbar todo el listado por un documento mal formado.
    tip_id: toStringId(tip?.tip_id),
    site_id: toStringOrNull(tip?.site_id),
    date: toStringOrNull(tip?.date),
    reviewed_place: toStringOrNull(tip?.reviewed_place),
    reviewed_category: toStringOrNull(tip?.reviewed_category),
    comment: toStringOrNull(tip?.comment),
    score: toNumberOrNull(tip?.score),
  };
}

export function toExpandedTip(doc: Document): ExpandedTipDto {
  return {
    user_name: toStringOrNull(doc.user_name),
    municipio: toStringOrNull(doc.municipio),
    departamento: toStringOrNull(doc.departamento),
    tip: toTipDetails((doc.tip ?? {}) as Document),
  };
}

/**
 * El pipeline del heatmap ya proyecta solo latitude y longitude, así que aquí
 * no hay filtrado que hacer. El campo weight sigue comentado en el modelo
 * original y se deja fuera.
 */
export function toHeatmapPoint(doc: Document): HeatmapPointDto {
  return {
    latitude: toNumberOrNull(doc.latitude),
    longitude: toNumberOrNull(doc.longitude),
  };
}
