/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiCommunityDemographics:
 *        type: object
 *        required:
 *          - communityId
 *          - date
 *          - male
 *          - female
 *          - undisclosed
 *          - totalGender
 *          - ageArange1
 *          - ageArange2
 *          - ageArange3
 *          - ageArange4
 *          - ageArange5
 *          - ageArange6
 *        properties:
 *          communityId:
 *            type: integer
 *            description: The community id
 *          date:
 *            type: string
 *            format: date
 *            description: Date of which the daily metrics represents
 *          male:
 *            type: integer
 *            description: Number of male beneficiaries, according to their profile info
 *          female:
 *            type: integer
 *            description: Number of female beneficiaries, according to their profile info
 *          undisclosed:
 *            type: integer
 *            description: Number of undisclosed beneficiaries, according to their profile info
 *          totalGender:
 *            type: integer
 *            description: Number of beneficiaries that answered as male or female, according to their profile info
 *          ageRange1:
 *            type: integer
 *            description: Number of beneficiaries on age range 1, according to their profile info
 *          ageRange2:
 *            type: integer
 *            description: Number of beneficiaries on age range 2, according to their profile info
 *          ageRange3:
 *            type: integer
 *            description: Number of beneficiaries on age range 3, according to their profile info
 *          ageRange4:
 *            type: integer
 *            description: Number of beneficiaries on age range 4, according to their profile info
 *          ageRange5:
 *            type: integer
 *            description: Number of beneficiaries on age range 5, according to their profile info
 *          ageRange6:
 *            type: integer
 *            description: Number of beneficiaries on age range 6, according to their profile info
 */
export interface UbiCommunityDemographics {
    id: number;
    communityId: number;
    date: Date;
    male: number;
    female: number;
    undisclosed: number;
    totalGender: number;
    ageRange1: number;
    ageRange2: number;
    ageRange3: number;
    ageRange4: number;
    ageRange5: number;
    ageRange6: number;
}
export interface UbiCommunityDemographicsCreation {
    communityId: number;
    date: Date;
    male: number;
    female: number;
    undisclosed: number;
    totalGender: number;
    ageRange1: number;
    ageRange2: number;
    ageRange3: number;
    ageRange4: number;
    ageRange5: number;
    ageRange6: number;
}
