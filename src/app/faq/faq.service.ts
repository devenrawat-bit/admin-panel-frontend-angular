import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Faq {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
}

export interface FaqListResponse {
  success: boolean;
  data: {
    data: Faq[];
    totalItems: number;
    page: number;
    pageSize: number;
  };
  message?: string;
}

export interface FaqResponse {
  success: boolean;
  data?: Faq;
  message: string;
}

export interface PaginationRequest {
  page: number;
  pageSize: number;
  searchColumn?: string;
  searchValue?: string;
  sortColumn?: string;
  sortDirection?: string;
  additionalProp1?: string;
  additionalProp2?: string;
  additionalProp3?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FaqService {
  private apiUrl = 'https://localhost:7065/api/Faq';

  constructor(private http: HttpClient) {}

  getFaqs(
    page: number,
    pageSize: number,
    question?: string,
    isActive?: string,
    sortColumn?: string,
    sortDirection?: string
  ): Observable<FaqListResponse> {
    const body: PaginationRequest = {
      page: page,
      pageSize: pageSize,
      sortColumn: sortColumn || 'CreatedAt',
      sortDirection: sortDirection || 'desc',
    };

    // Add search filters if provided
    if (question) {
      body.searchColumn = 'Question';
      body.searchValue = question;
    }

    // Note: IsActive filter might need to be handled differently
    // depending on your backend implementation
    if (isActive) {
      body.additionalProp1 = isActive;
    }

    console.log('=== FAQ GET REQUEST ===');
    console.log('Request body:', body);
    console.log('Sort column:', body.sortColumn);
    console.log('Sort direction:', body.sortDirection);

    return this.http.post<FaqListResponse>(`${this.apiUrl}/get-faq`, body);
  }

  getFaqById(id: number): Observable<any> {
    // Since there's no dedicated GET by ID endpoint,
    // we'll fetch all FAQs and filter on the frontend
    // Or you can add a GET endpoint in your backend
    const body: PaginationRequest = {
      page: 1,
      pageSize: 1000, // Get all to find the specific one
      sortColumn: 'CreatedAt',
      sortDirection: 'asc',
    };

    return this.http.post<FaqListResponse>(`${this.apiUrl}/get-faq`, body);
  }

  createFaq(faq: {
    question: string;
    answer: string;
    isActive: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-faq`, faq);
  }

  updateFaq(
    id: number,
    faq: {
      question: string;
      answer: string;
      isActive: boolean;
    }
  ): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-faq/${id}`, faq);
  }

  deleteFaq(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete-faq/${id}`);
  }
}

