import { Document } from 'mongodb';
import {
  toNumberOrNull,
  toStringId,
  toStringOrNull,
} from '../shared/mongo.util';
import { SiteGoogleDto } from './dto/google-response.dto';

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
