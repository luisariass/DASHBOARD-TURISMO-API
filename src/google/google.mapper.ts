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
  SiteGoogleDto,
  TipDetailsDto,
} from './dto/google-response.dto';

/**
 * Mappers para normalizar las respuestas de Foursquare según el contrato de la API.
 */


export function toSiteGoogle(doc: Document): SiteGoogleDto {
  return {
    _id: toStringId(doc._id),
    nombre: toStringOrNull(doc.nombre),
    municipio: toStringOrNull(doc.municipio),
    departamento: toStringOrNull(doc.departamento),
    categoria: toStringOrNull(doc.categoria),
    puntuacion: toNumberOrNull(doc.puntuacion),
  };
}


export function toReviewer(doc: Document): ReviewerDto {
  return {
    _id: toStringId(doc._id),
    id: toStringOrNull(doc.id),
    user_name: toStringOrNull(doc.user_name),
    municipio: toStringOrNull(doc.municipio),
    departamento: toStringOrNull(doc.departamento),
  };
}

function toTipDetails(tip: Document): TipDetailsDto {
  return {
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

export function toHeatmapPoint(doc: Document): HeatmapPointDto {
  return {
    latitude: toNumberOrNull(doc.latitude),
    longitude: toNumberOrNull(doc.longitude),
  };
}
