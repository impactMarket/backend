import { ICommunityContractParams } from '../../types';
import { AppMediaContent } from '../app/appMediaContent';
import { AppProposal } from '../app/appProposal';
import { StoryCommunity } from '../story/storyCommunity';
import { BeneficiaryAttributes } from './beneficiary';
import { UbiClaimLocation } from './ubiClaimLocation';
import { UbiCommunityContract } from './ubiCommunityContract';
import { UbiCommunityDailyMetrics } from './ubiCommunityDailyMetrics';
import { UbiCommunityDailyState } from './ubiCommunityDailyState';
import { UbiCommunityDemographics } from './ubiCommunityDemographics';
import { UbiCommunityState } from './ubiCommunityState';
import { UbiCommunitySuspect } from './ubiCommunitySuspect';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Community:
 *        type: object
 *        required:
 *          - id
 *          - publicId
 *          - requestByAddress
 *          - contractAddress
 *          - name
 *          - description
 *          - descriptionEn
 *          - language
 *          - currency
 *          - city
 *          - country
 *          - gps
 *          - email
 *          - visibility
 *          - coverImage
 *          - coverMediaId
 *          - coverMediaPath
 *          - status
 *          - review
 *          - started
 *          - proposalId
 *          - metrics
 *          - cover
 *          - proposal
 *          - contract
 *          - state
 *          - storyCommunity
 *          - suspect
 *          - beneficiaries
 *          - claimLocation
 *          - demographics
 *          - dailyState
 *          - createdAt
 *          - updatedAt
 *          - deletedAt
 *        properties:
 *          id:
 *            type: integer
 *          publicId:
 *            type: string
 *          requestByAddress:
 *            type: string
 *          contractAddress:
 *            type: string
 *          name:
 *            type: string
 *          description:
 *            type: string
 *          descriptionEn:
 *            type: string
 *          language:
 *            type: string
 *          currency:
 *            type: string
 *          city:
 *            type: string
 *          country:
 *            type: string
 *          gps:
 *            type: object
 *            properties:
 *              latitude:
 *                type: integer
 *              longitude:
 *                type: integer
 *          email:
 *            type: string
 *          visibility:
 *            type: string
 *            enum: [public, private]
 *          coverImage:
 *            type: string
 *          coverMediaId:
 *            type: integer
 *          coverMediaPath:
 *            type: string
 *          status:
 *            type: string
 *            enum: [pending,valid,removed]
 *          review:
 *            type: string
 *            enum: [pending,claimed,declined,accepted]
 *          started:
 *            type: string
 *          proposalId:
 *            type: integer
 *          metrics:
 *            $ref: '#/components/schemas/UbiCommunityDailyMetrics'
 *          cover:
 *            $ref: '#/components/schemas/AppMediaContent'
 *          proposal:
 *            $ref: '#/components/schemas/AppProposal'
 *          contract:
 *            $ref: '#/components/schemas/UbiCommunityContract'
 *          state:
 *            $ref: '#/components/schemas/UbiCommunityState'
 *          storyCommunity:
 *            $ref: '#/components/schemas/StoryCommunity'
 *          suspect:
 *            $ref: '#/components/schemas/UbiCommunitySuspect'
 *          beneficiaries:
 *            $ref: '#/components/schemas/Beneficiary'
 *          claimLocation:
 *            $ref: '#/components/schemas/UbiClaimLocation'
 *          demographics:
 *            $ref: '#/components/schemas/UbiCommunityDemographics'
 *          dailyState:
 *            $ref: '#/components/schemas/UbiCommunityDailyState'
 *          createdAt:
 *            type: string
 *          updatedAt:
 *            type: string
 *          deletedAt:
 *            type: string
 */

export interface CommunityAttributes {
    id: number; // Note that the `null assertion` `!` is required in strict mode.
    publicId: string; // TODO: to be removed
    requestByAddress: string;
    contractAddress: string | null;
    name: string;
    description: string;
    descriptionEn: string | null;
    language: string;
    currency: string;
    city: string;
    country: string;
    gps: {
        latitude: number;
        longitude: number;
    };
    email: string;
    visibility: 'public' | 'private';
    coverImage: string; // TODO: to be removed
    coverMediaId: number;
    coverMediaPath: string;
    status: 'pending' | 'valid' | 'removed'; // pending / valid / removed
    review: 'pending' | 'claimed' | 'declined' | 'accepted';
    started: Date; // TODO: to be removed
    proposalId: number | null;
    ambassadorAddress: string | null;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;

    metrics?: UbiCommunityDailyMetrics[]; // TODO: to be removed
    cover?: AppMediaContent;
    proposal?: AppProposal;
    contract?: UbiCommunityContract; // TODO: to be removed
    state?: UbiCommunityState; // TODO: to be removed
    storyCommunity?: StoryCommunity[]; // TODO: to be removed
    suspect?: UbiCommunitySuspect[]; // TODO: to be removed
    beneficiaries?: BeneficiaryAttributes[]; // TODO: to be removed
    // promoter?: UbiPromoter;
    claimLocation?: UbiClaimLocation[]; // TODO: to be removed
    demographics?: UbiCommunityDemographics[]; // TODO: to be removed
    dailyState?: UbiCommunityDailyState[]; // TODO: to be removed
}

export interface ICommunityCreationAttributes extends IBaseCommunityAttributes {
    descriptionEn?: string;
    visibility?: 'public' | 'private';
    coverImage?: string; // TODO: will be required once next version is released
    status?: 'pending' | 'valid' | 'removed'; // pending / valid / removed
    started?: Date;
    txReceipt?: any | undefined;
    contractParams?: ICommunityContractParams;
}

export interface IBaseCommunityAttributes {
    requestByAddress: string;
    name: string;
    contractAddress?: string | undefined;
    description: string;
    language: string;
    currency: string;
    city: string;
    country: string;
    gps: {
        latitude: number;
        longitude: number;
    };
    email: string;
    coverMediaId?: number;
    coverMediaPath?: string;
    contractParams?: ICommunityContractParams;
}
