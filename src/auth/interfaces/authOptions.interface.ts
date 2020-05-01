import { IOpenIdMetadata } from './clientMetadata.interface';
import { IOAuth2Metadata } from './oAuth2Metadata.interface';
import { StrategyTypes } from './strategyTypes.enum';

export interface IAuthOptions {
    strategyType: StrategyTypes;
    clientMetaData: IOpenIdMetadata | IOAuth2Metadata;
}
