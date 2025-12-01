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
    const body: any = {
      page: page,
      pageSize: pageSize,
      search: '',
      sortColumn: sortColumn || 'CreatedAt',
      sortDirection: sortDirection || 'desc',
      filters: {}
    };

    // Add filters as key-value pairs in the filters object
    if (question && question.trim()) {
      body.filters['question'] = question.trim();
    }

    if (isActive && isActive.trim()) {
      body.filters['isActive'] = isActive.trim();
    }

    console.log('=== FAQ GET REQUEST ===');
    console.log('Request body:', body);
    console.log('Filters:', body.filters);

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
    return this.http.post(`${this.apiUrl}/add-faq`, faq, { 
      responseType: 'text' as 'json'
    });
  }

  updateFaq(
    id: number,
    faq: {
      question: string;
      answer: string;
      isActive: boolean;
    }
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-faq/${id}`, faq, { 
      responseType: 'text' as 'json'
    });
  }

  deleteFaq(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete-faq/${id}`);
  }
}

